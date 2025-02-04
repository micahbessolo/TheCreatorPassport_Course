if ((process.env.NODE_ENV || '').trim() !== 'production')
{
    require('dotenv').config();
}
else
{
    console.log("Production")
}

const express = require('express');
const app = express();
const PORT = 3000;
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// mongodb connection and models
const connectMongoDB = require("./mongodb");
const userCollection = require('./models/user-collection');
const videosCollection = require('./models/video-collections');
let postsCollection = require('./models/post-collection-1');
const notificationsCollection = require('./models/notification-collection');

const { topNav, topNavNotifications, markNotificationRead } = require('./topnav');
const initializePassport = require('./passport-config');
const {forgotPassword, resetPassword} = require("./password_recovery/auth");
const multer  = require('multer');

const storage = multer.diskStorage({
    filename: function (req, file, cb)
    {
        cb(null, file.originalname)
    }
});
const upload = multer({storage: storage});

initializePassport(passport, 
    email => userCollection.findOne({email: email}),
    id => userCollection.findOne({_id: id})
);

app.set('view-engine', 'ejs');
app.use('/assets', express.static('assets'));
app.use(express.urlencoded({ extended:false })); // helps access form data at req in post methods
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session()); // keeps track of the user's session
app.use(methodOverride('_method'));

const setCSPHeaders = (req, res, next) =>
{
    res.setHeader("Content-Security-Policy", "default-src 'self'; form-action 'self';");
    next();
};

app.get('/login', checkNotAuthenticated, (req, res) => 
{
    res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, setCSPHeaders, passport.authenticate('local', 
{
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.delete('/logout', (req, res) =>
{
    req.logout(req.user, err =>
    {
        if(err) return next(err);
        res.redirect("/login");
    });
});

app.get('/forgot-password', (req, res) => 
{
    res.render('forgot-password.ejs');
});

app.post('/forgot-password', forgotPassword);

app.get('/reset-password', (req, res) => 
{
    res.render('reset-password.ejs');
});

app.post('/reset-password', resetPassword);

function checkAuthenticated(req, res, next)
{
    if (req.isAuthenticated()) // req.isAuthenticated() is a passport function that returns true if the user is authenticated
    {
        return next();
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next)
{
    if (req.isAuthenticated())
    {
        return res.redirect('/');
    }
    next();
}

app.get('/', checkAuthenticated, async (req, res) =>
{
    let userEmail;
    let userName;
    let profileImg;
    let cohort;
    let isAdmin;

    await userCollection.findOne({_id: req.user._conditions._id}).then((info) =>
    {
        userEmail = info.email;
        userName = info.name;
        profileImg = info.profileImg;
        liveTrainingsProgress = info.liveTrainingsProgress;;
        cohort = info.cohort
        isAdmin = info.admin;
    });

    if (userEmail === "ryanleebanksmedia@gmail.com" || userEmail === "dani@theloverspassport.com" 
    || userEmail === "dreamwithlo@gmail.com" || userEmail === "maggie@theloverspassport.com"
    || userEmail === "bessolomicah@gmail.com" || userEmail === "stephenjiroch99@gmail.com" || userEmail === "thecreatorpassport@gmail.com")
    {
        cohort = 3;
    }

    res.render('dashboard.ejs', {
        userName: userName,
        email: userEmail,
        profileImg: profileImg,
        liveTrainingsProgress: liveTrainingsProgress,
        cohort: cohort,
        isAdmin: isAdmin
    });
});

app.get('/admin-page', checkAuthenticated, async (req, res) =>
{
    res.render('admin.ejs');
});

app.get('/find-user-by-email/:email', checkAuthenticated, async (req, res) =>
{
    const email = req.params.email;
    const userId = req.user._conditions._id.toString();

    try
    {
        // Verify that the person calling the function is an admin
        const adminUser = await userCollection.findOne({ _id: userId, admin: true });
        if (!adminUser)
        {
            return res.status(403).send('Access denied. Admin privileges required.');
        }

        // Search for the user by email
        const user = await userCollection.findOne({ email: email });
        if (!user)
        {
            return res.status(404).send('User not found.');
        }

        // Return the user's name
        res.status(200).json({ name: user.name });
    }
    catch (err)
    {
        res.status(500).send('Error finding user: ' + err);
    }
});

app.delete('/delete-user-by-email/:email', checkAuthenticated, async (req, res) =>
{
    const email = req.params.email;
    const userId = req.user._conditions._id.toString();

    try
    {
        const adminUser = await userCollection.findOne({ _id: userId, admin: true });
        if (!adminUser)
        {
            return res.status(403).send('Access denied. Admin privileges required.');
        }

        // Delete the user by email
        const result = await userCollection.deleteOne({ email: email });
        if (result.deletedCount === 0)
        {
            return res.status(404).send('User not found.');
        }

        // Return success message
        res.status(200).send('User deleted successfully.');
    }
    catch (err)
    {
        res.status(500).send('Error deleting user: ' + err);
    }
});

app.get('/update-email/:oldEmail/:newEmail', checkAuthenticated, async (req, res) =>
{
    const oldEmail = req.params.oldEmail;
    const newEmail = req.params.newEmail;
    const userId = req.user._conditions._id.toString();

    try
    {
        const adminUser = await userCollection.findOne({ _id: userId, admin: true });
        if (!adminUser)
        {
            return res.status(403).send('Access denied. Admin privileges required.');
        }

        const result = await userCollection.findOneAndUpdate(
            { email: oldEmail },
            { $set: { email: newEmail } },
            { new: true }
        );

        if (!result)
        {
            return res.status(404).send('User not found.');
        }

        res.status(200).send('Email updated successfully.');
    }
    catch (err)
    {
        console.log("Error updating email: " + err);
        res.status(500).send('An error occurred while updating the email.');
    }
});

app.post('/add-user/:firstName/:lastName/:email', checkAuthenticated, async (req, res) =>
{
    const { firstName, lastName, email } = req.params;
    const userId = req.user._conditions._id.toString();
    const fullName = `${firstName} ${lastName}`;

    try
    {
        const adminUser = await userCollection.findOne({ _id: userId, admin: true });
        if (!adminUser)
        {
            return res.status(403).send('Access denied. Admin privileges required.');
        }

        // Check if any document in userCollection has a matching email
        const existingUser = await userCollection.findOne({ email: email });
        if (existingUser)
        {
            return res.status(400).send('User with this email already exists.');
        }


        // Create a new document with the combined first name and last name and the email
        const newUser =
        {
            password: 'temporaryPassword123',
            name: fullName,
            email: email,
            createdDate: new Date().toISOString()
        };
        await userCollection.create(newUser);

        // Return success message
        res.status(201).send('User created successfully.');
    }
    catch (err)
    {
        res.status(500).send('Error creating user: ' + err);
    }
});

app.get('/send-first-time-email/:email', checkAuthenticated, async (req, res) => 
{
    const email = req.params.email;
    const userId = req.user._conditions._id.toString();

    try
    {
        const adminUser = await userCollection.findOne({ _id: userId, admin: true });
        if (!adminUser)
        {
            return res.status(403).send('Access denied. Admin privileges required.');
        }

        await userCollection.findOne({email: email}).then((user, err) =>
        {
            if (err || !user)
            {
                return res.render('forgot-password.ejs', { messages: 'No user with that email' });
            }
            userName = user.name;
    
            const token = jwt.sign({_id: user._id}, process.env.RESET_PASSWORD_KEY, {expiresIn: '20m'});
    
            const data =
            {
                from: 'noreply@theloverspassport.com',
                to: email,
                subject: 'Password Reset',
                html:
                `<html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta name="x-apple-disable-message-reformatting" />
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <meta name="color-scheme" content="light dark" />
                    <meta name="supported-color-schemes" content="light dark" />
                    <title></title>
                    <style type="text/css" rel="stylesheet" media="all">
                    
                    @import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");
                    body {
                    width: 100% !important;
                    height: 100%;
                    margin: 0;
                    -webkit-text-size-adjust: none;
                    }
                    
                    a {
                    color: #3869D4;
                    }
                    
                    a img {
                    border: none;
                    }
                    
                    td {
                    word-break: break-word;
                    }
                    
                    .preheader {
                    display: none !important;
                    visibility: hidden;
                    mso-hide: all;
                    font-size: 1px;
                    line-height: 1px;
                    max-height: 0;
                    max-width: 0;
                    opacity: 0;
                    overflow: hidden;
                    }
                    /* Type ------------------------------ */
                    
                    body,
                    td,
                    th {
                    font-family: "Nunito Sans", Helvetica, Arial, sans-serif;
                    }
                    
                    h1 {
                    margin-top: 0;
                    color: #333333;
                    font-size: 22px;
                    font-weight: bold;
                    text-align: left;
                    }
                    
                    h2 {
                    margin-top: 0;
                    color: #333333;
                    font-size: 16px;
                    font-weight: bold;
                    text-align: left;
                    }
                    
                    h3 {
                    margin-top: 0;
                    color: #333333;
                    font-size: 14px;
                    font-weight: bold;
                    text-align: left;
                    }
                    
                    td,
                    th {
                    font-size: 16px;
                    }
                    
                    p,
                    ul,
                    ol,
                    blockquote {
                    margin: .4em 0 1.1875em;
                    font-size: 16px;
                    line-height: 1.625;
                    }
                    
                    p.sub {
                    font-size: 13px;
                    }
                    /* Utilities ------------------------------ */
                    
                    .align-right {
                    text-align: right;
                    }
                    
                    .align-left {
                    text-align: left;
                    }
                    
                    .align-center {
                    text-align: center;
                    }
                    
                    .u-margin-bottom-none {
                    margin-bottom: 0;
                    }
                    /* Buttons ------------------------------ */
                    
                    .button {
                    background-color: #3869D4;
                    border-top: 10px solid #3869D4;
                    border-right: 18px solid #3869D4;
                    border-bottom: 10px solid #3869D4;
                    border-left: 18px solid #3869D4;
                    display: inline-block;
                    color: #FFF;
                    text-decoration: none;
                    border-radius: 3px;
                    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16);
                    -webkit-text-size-adjust: none;
                    box-sizing: border-box;
                    }
                    
                    .button--green {
                    background-color: #22bc66;
                    color: white;
                    border-top: 10px solid #22BC66;
                    border-right: 18px solid #22BC66;
                    border-bottom: 10px solid #22BC66;
                    border-left: 18px solid #22BC66;
                    }
                    
                    .button--red {
                    background-color: #FF6136;
                    border-top: 10px solid #FF6136;
                    border-right: 18px solid #FF6136;
                    border-bottom: 10px solid #FF6136;
                    border-left: 18px solid #FF6136;
                    }
                    
                    @media only screen and (max-width: 500px) {
                    .button {
                        width: 100% !important;
                        text-align: center !important;
                    }
                    }
                    /* Attribute list ------------------------------ */
                    
                    .attributes {
                    margin: 0 0 21px;
                    }
                    
                    .attributes_content {
                    background-color: #F4F4F7;
                    padding: 16px;
                    }
                    
                    .attributes_item {
                    padding: 0;
                    }
                    /* Related Items ------------------------------ */
                    
                    .related {
                    width: 100%;
                    margin: 0;
                    padding: 25px 0 0 0;
                    -premailer-width: 100%;
                    -premailer-cellpadding: 0;
                    -premailer-cellspacing: 0;
                    }
                    
                    .related_item {
                    padding: 10px 0;
                    color: #CBCCCF;
                    font-size: 15px;
                    line-height: 18px;
                    }
                    
                    .related_item-title {
                    display: block;
                    margin: .5em 0 0;
                    }
                    
                    .related_item-thumb {
                    display: block;
                    padding-bottom: 10px;
                    }
                    
                    .related_heading {
                    border-top: 1px solid #CBCCCF;
                    text-align: center;
                    padding: 25px 0 10px;
                    }
                    /* Discount Code ------------------------------ */
                    
                    .discount {
                    width: 100%;
                    margin: 0;
                    padding: 24px;
                    -premailer-width: 100%;
                    -premailer-cellpadding: 0;
                    -premailer-cellspacing: 0;
                    background-color: #F4F4F7;
                    border: 2px dashed #CBCCCF;
                    }
                    
                    .discount_heading {
                    text-align: center;
                    }
                    
                    .discount_body {
                    text-align: center;
                    font-size: 15px;
                    }
                    /* Social Icons ------------------------------ */
                    
                    .social {
                    width: auto;
                    }
                    
                    .social td {
                    padding: 0;
                    width: auto;
                    }
                    
                    .social_icon {
                    height: 20px;
                    margin: 0 8px 10px 8px;
                    padding: 0;
                    }
                    /* Data table ------------------------------ */
                    
                    .purchase {
                    width: 100%;
                    margin: 0;
                    padding: 35px 0;
                    -premailer-width: 100%;
                    -premailer-cellpadding: 0;
                    -premailer-cellspacing: 0;
                    }
                    
                    .purchase_content {
                    width: 100%;
                    margin: 0;
                    padding: 25px 0 0 0;
                    -premailer-width: 100%;
                    -premailer-cellpadding: 0;
                    -premailer-cellspacing: 0;
                    }
                    
                    .purchase_item {
                    padding: 10px 0;
                    color: #51545E;
                    font-size: 15px;
                    line-height: 18px;
                    }
                    
                    .purchase_heading {
                    padding-bottom: 8px;
                    border-bottom: 1px solid #EAEAEC;
                    }
                    
                    .purchase_heading p {
                    margin: 0;
                    color: #85878E;
                    font-size: 12px;
                    }
                    
                    .purchase_footer {
                    padding-top: 15px;
                    border-top: 1px solid #EAEAEC;
                    }
                    
                    .purchase_total {
                    margin: 0;
                    text-align: right;
                    font-weight: bold;
                    color: #333333;
                    }
                    
                    .purchase_total--label {
                    padding: 0 15px 0 0;
                    }
                    
                    body {
                    background-color: #F2F4F6;
                    color: #51545E;
                    }
                    
                    p {
                    color: #51545E;
                    }
                    
                    .email-wrapper {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    -premailer-width: 100%;
                    -premailer-cellpadding: 0;
                    -premailer-cellspacing: 0;
                    background-color: #F2F4F6;
                    }
                    
                    .email-content {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    -premailer-width: 100%;
                    -premailer-cellpadding: 0;
                    -premailer-cellspacing: 0;
                    }
                    /* Masthead ----------------------- */
                    
                    .email-masthead {
                    padding: 25px 0;
                    text-align: center;
                    }
                    
                    .email-masthead_logo {
                    width: 94px;
                    }
                    
                    .email-masthead_name {
                    font-size: 16px;
                    font-weight: bold;
                    color: #A8AAAF;
                    text-decoration: none;
                    text-shadow: 0 1px 0 white;
                    }
                    /* Body ------------------------------ */
                    
                    .email-body {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    -premailer-width: 100%;
                    -premailer-cellpadding: 0;
                    -premailer-cellspacing: 0;
                    }
                    
                    .email-body_inner {
                    width: 570px;
                    margin: 0 auto;
                    padding: 0;
                    -premailer-width: 570px;
                    -premailer-cellpadding: 0;
                    -premailer-cellspacing: 0;
                    background-color: #FFFFFF;
                    }
                    
                    .email-footer {
                    width: 570px;
                    margin: 0 auto;
                    padding: 0;
                    -premailer-width: 570px;
                    -premailer-cellpadding: 0;
                    -premailer-cellspacing: 0;
                    text-align: center;
                    }
                    
                    .email-footer p {
                    color: #A8AAAF;
                    }
                    
                    .body-action {
                    width: 100%;
                    margin: 30px auto;
                    padding: 0;
                    -premailer-width: 100%;
                    -premailer-cellpadding: 0;
                    -premailer-cellspacing: 0;
                    text-align: center;
                    }
                    
                    .body-sub {
                    margin-top: 25px;
                    padding-top: 25px;
                    border-top: 1px solid #EAEAEC;
                    }
                    
                    .content-cell {
                    padding: 45px;
                    }
                    /*Media Queries ------------------------------ */
                    
                    @media only screen and (max-width: 600px) {
                    .email-body_inner,
                    .email-footer {
                        width: 100% !important;
                    }
                    }
                    
                    @media (prefers-color-scheme: dark) {
                    body,
                    .email-body,
                    .email-body_inner,
                    .email-content,
                    .email-wrapper,
                    .email-masthead,
                    .email-footer {
                        background-color: #333333 !important;
                        color: #FFF !important;
                    }
                    p,
                    ul,
                    ol,
                    blockquote,
                    h1,
                    h2,
                    h3,
                    span,
                    .purchase_item {
                        color: #FFF !important;
                    }
                    .attributes_content,
                    .discount {
                        background-color: #222 !important;
                    }
                    .email-masthead_name {
                        text-shadow: none !important;
                    }
                    }
                    
                    :root {
                    color-scheme: light dark;
                    supported-color-schemes: light dark;
                    }
                    </style>
                    <!--[if mso]>
                    <style type="text/css">
                    .f-fallback  {
                        font-family: Arial, sans-serif;
                    }
                    </style>
                <![endif]-->
                </head>
                <body>
                    <span class="preheader">Use this link to reset your password. The link is only valid for 24 hours.</span>
                    <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td align="center">
                        <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                            <td class="email-masthead">
                                <a href="https://theloverspassport.com/" class="f-fallback email-masthead_name">
                                The Lovers Passport
                            </a>
                            </td>
                            </tr>
                            <!-- Email Body -->
                            <tr>
                            <td class="email-body" width="570" cellpadding="0" cellspacing="0">
                                <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                                <!-- Body content -->
                                <tr>
                                    <td class="content-cell">
                                    <div class="f-fallback">
                                        <h1>Hi ${userName},</h1>
                                        <p>You recently purchased the Creator Passport course account. Use the button below to create a password. <strong>This password reset is only valid for the next 20 minutes</strong></p>
                                        <br>
                                        <p>If 20 minutes have passed and you need a new link, click <a href="https://thecreatorpassport.com/forgot-password" target="_blank" style="text-decoration: underline !important;">here</a></p>
                                        <!-- Action -->
                                        <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                        <tr>
                                            <td align="center">
                                            <!-- Border based button
                        https://litmus.com/blog/a-guide-to-bulletproof-buttons-in-email-design -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                                <tr>
                                                <td align="center">
                                                    <a href="https://thecreatorpassport.com/reset-password/?access_token=${token}" class="f-fallback button button--green" target="_blank">Create your password</a>
                                                </td>
                                                </tr>
                                            </table>
                                            </td>
                                        </tr>
                                        </table>
                                        <p>Thanks,
                                        <br>The Lovers Passport team</p>
                                        <!-- Sub copy -->
                                        <table class="body-sub" role="presentation">
                                        <tr>
                                            <td>
                                            <p class="f-fallback sub">If you’re having trouble with the button above, copy and paste the URL below into your web browser.</p>
                                            <p class="f-fallback sub">https://thecreatorpassport.com/reset-password/?access_token=${token}</p>
                                            </td>
                                        </tr>
                                        </table>
                                    </div>
                                    </td>
                                </tr>
                                </table>
                            </td>
                            </tr>
                            <tr>
                            <td>
                                <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td class="content-cell" align="center">
                                    <p class="f-fallback sub align-center">
                                        The Lovers Passport LLC
                                    </p>
                                    </td>
                                </tr>
                                </table>
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    </table>
                </body>
                </html>
                `
            };
    
            return user.updateOne({resetLink: token}).then(function(success, err)
            {
                if(err)
                {
                    return res.json(
                    {
                        error: err.message
                    });
                }
                else
                {
                    mg.messages().send(data, function(error, body)
                    {
                        if(error)
                        {
                            return res.json(
                            {
                                error: error.message
                            });
                        }
                        return;
                    });
                }
            });
        });

        // Return success message
        res.status(201).send('Email sent successfully.');
    }
    catch (err)
    {
        res.status(500).send('Error sending email: ' + err);
    }
});

app.get('/topNav/:page', checkAuthenticated, async (req, res) => 
{
    res.send(await topNav(req));
});

app.get('/topNavNotifications/:type', checkAuthenticated, async (req, res) =>
{
    res.send(await topNavNotifications(req));
});

app.post('/mark-notification-read', checkAuthenticated, async (req, res) =>
{
    res.send(await markNotificationRead(req));
});

app.post('/update-user', checkAuthenticated, upload.single('profileImg'), async (req, res) =>
{
    const { email } = req.body;
    let profileImg = req.file;
    const userId = req.user._conditions._id.toString();

    try
    {
        let user = await userCollection.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (profileImg)
        {
            if (user.profileImg)
            {
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }

            const uploadedResponse = await cloudinary.uploader.upload(req.file.path, 
            { 
                transformation: [
                    { width: 200, height: 200, crop: "thumb", gravity: "center" }
                ]
            }, 
            function (err)
            {
                if(err)
                {
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        message: "Error"
                    })
                }
            });
            profileImg = uploadedResponse.secure_url;
        }

        user.email = email || user.email;
        user.profileImg = profileImg || user.profileImg;
        user = await user.save();

        return res.json({profileImg: user.profileImg, email: user.email})
    }
    catch (error)
    {
        console.log("Error in updateUser: ", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/search-videos/:searchInput', checkAuthenticated, async (req, res) =>
{
    const searchInput = req.params.searchInput;

    try
    {
        const results = await videosCollection.find({
            titles: {
                $elemMatch: {
                    $regex: searchInput,
                    $options: 'i' // Case-insensitive search
                }
            }
        });

        let resultsArray = [];

        for (let i = 0; i < results.length; i++)
        {            
            for (let j = 0; j < results[i].titles.length; j++)
            {
                if (results[i].titles[j].toLowerCase().includes(searchInput.toLowerCase()))
                {
                    let obj = {};
                    obj.title = results[i].titles[j].split(' - ')[1];
                    const trackMod = results[i].trackMod;
                    obj.module = `${trackMod}-${results[i].titles[j].split(' - ')[0].split('.')[1]}`;
                    obj.thumbnail = `./assets/images/${obj.module}.png`;

                    resultsArray.push(obj);
                }
            }
        }
        res.json(resultsArray);
    } 
    catch (error)
    {
        console.error('Error searching videos:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/count-cohort-3', async (req, res) => {
    try {
        const count = await userCollection.countDocuments({ cohort: 3 });
        res.status(200).json({ count });
    } catch (error) {
        console.log("Error in counting documents: ", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/live-trainings', checkAuthenticated, async (req, res) => 
{
    let liveTrainingsProgress;
    let likedVideoList;

    await userCollection.findOne({_id: req.user._conditions._id}).then((info) =>
    {
        liveTrainingsProgress = info.liveTrainingsProgress;
        likedVideoList = info.likedVideos;
    });

    res.render('live-trainings.ejs', {
        liveTrainingsProgress: liveTrainingsProgress,
        likedVideoList: likedVideoList
    });
});

app.get('/live-trainings-object', checkAuthenticated, async (req, res) => {
    const results = await videosCollection.findOne({trackMod: "Live Trainings"}).then((info) =>
    {
        return info;
    });

    res.json(results);
});

app.get('/community-page', checkAuthenticated, async (req, res) =>
{
    let userEmail;
    let userName;
    let profileImg;
    let isAdmin;
    const userID = req.user._conditions._id;

    await userCollection.findOne({_id: req.user._conditions._id}).then((info) =>
    {
        userEmail = info.email;
        userName = info.name;
        profileImg = info.profileImg
        isAdmin = info.admin;
    });

    res.render('community.ejs', {
        userName: userName,
        email: userEmail,
        profileImg: profileImg,
        userID: userID,
        isAdmin: isAdmin
    });
});

app.get('/get-all-posts', checkAuthenticated, async (req, res) =>
{
    try
    {
        const posts = await postsCollection.find()
            .sort({ createdAt: -1 })
            // .limit(10) to limit to 10 most recent posts
            .populate({
                path: "user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10"
            })
            .populate({
                path: "comments.user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10"
            })
            .populate({
                path: "comments.comments.user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10"
            });

        if (posts.length === 0)
        {
            return res.status(200).json([]);
        }

        res.status(200).json(posts);
    }
    catch (error)
    {
        console.log("Error in getAllPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/get-posts', checkAuthenticated, async (req, res) =>
{
    const pageSize = 10; // number of posts per page
    const page = Number(req.query.page) || 1; // page number
    const isPinned = req.query.isPinned || false;

    try
    {
        const totalPosts = await postsCollection.countDocuments();
        const posts = await postsCollection.find({ pin: isPinned })
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .populate({
                path: "user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10"
            })
            .populate({
                path: "comments.user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10"
            })
            .populate({
                path: "comments.comments.user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10"
            });

        if (posts.length === 0)
        {
            return res.status(200).json([]);
        }

        res.status(200).json({
            posts,
            page,
            totalPages: Math.ceil(totalPosts / pageSize),
        });
    } 
    catch (error)
    {
        console.log("Error in getPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/get-post/:id', checkAuthenticated, async (req, res) =>
{
    try
    {
        const post = await postsCollection.findById(req.params.id)
            .populate({
                path: "user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10"
            })
            .populate({
                path: "comments.user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10"
            })
            .populate({
                path: "comments.comments.user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10"
            });

        if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json(post);
    } 
    catch (error)
    {
        console.log("Error in getPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/get-pdf-files', async (req, res) =>
{
    try
    {
        const pdfFiles = await postsCollection.find({
            pdfName: { $regex: /^.{1,}$/ },
            img: { $regex: /\.pdf$/ }
        }).sort({ updatedAt: -1 });

        let results = [];

        for (let i = 0; i < pdfFiles.length; i++)
        {
            let resultObject = {};
            resultObject.img = pdfFiles[i].img;
            resultObject.pdfName = pdfFiles[i].pdfName;
            resultObject.updatedAt = pdfFiles[i].updatedAt;
            let user = await userCollection.findById(pdfFiles[i].user);
            resultObject.user = user.name;
            results.push(resultObject);
        }

        res.status(200).json(results);
    }
    catch (error)
    {
        res.status(500).json({ error: "Internal server error" });
        console.log("Error in get-pdf-files controller: ", error);
    }
});


app.post('/create-post', checkAuthenticated, upload.single('image-post'), async (req, res) =>
{
    const { postText, pdfName } = req.body;
    let file = req.file;
    const userId = req.user._conditions._id.toString();

    try
    {
        let user = await userCollection.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!postText && !file)
        {
            return res.status(400).json({ error: "Post must have text or file" });
        }

        if (file)
        {
            let uploadedResponse;
            if (file.mimetype === 'application/pdf')
            {
                // Handle PDF upload
                uploadedResponse = await cloudinary.uploader.upload(req.file.path,
                {
                    resource_type: 'raw'
                },
                function (err)
                {
                    if (err)
                    {
                        console.log(err);
                        return res.status(500).json({
                            success: false,
                            message: "Error"
                        });
                    }
                });
            }
            else
            {
                // Handle image upload
                uploadedResponse = await cloudinary.uploader.upload(req.file.path,
                {
                    transformation: [
                        { width: 1000, height: 1000, crop: "limit" }
                    ]
                },
                function (err)
                {
                    if (err)
                    {
                        console.log(err);
                        return res.status(500).json({
                            success: false,
                            message: "Error"
                        });
                    }
                });
            }
            file = uploadedResponse.secure_url;
        }

        const newPost = new postsCollection({
            user: userId,
            text: postText,
            img: file,
            pdfName: pdfName || null
        });
        await newPost.save();
        res.status(201).json(newPost);
    }
    catch (error)
    {
        res.status(500).json({ error: "Internal server error" });
        console.log("Error in createPost controller: ", error);
    }
});

app.patch('/edit-post', checkAuthenticated, upload.single('image-post'), async (req, res) => 
{
    const parsedBody = JSON.parse(JSON.stringify(req.body));

    const postID = parsedBody.postID;
    const text = parsedBody.text;
    let image = req.file;
    const userId = req.user._conditions._id.toString();
    const user = await userCollection.findById(req.user._conditions._id);

    try 
    {
        let post = await postsCollection.findById(postID);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.user.toString() !== userId && !user.admin)
        {
            return res.status(403).json({ message: "You are not authorized to edit this post" });
        }

        if (!text && !image)
        {
            return res.status(400).json({ error: "Post must have text or image" });
        }

        if (image)
        {
            const uploadedResponse = await cloudinary.uploader.upload(req.file.path,
            {
                transformation: [
                    { width: 1000, height: 1000, crop: "limit" }
                ]
            },
            function (err)
            {
                if (err)
                {
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        message: "Error"
                    });
                }
            });
            image = uploadedResponse.secure_url;
        }

        post.text = text || post.text;
        post.img = image || post.img;

        await post.save();
        res.status(200).json(post);
    }
    catch (error)
    {
        res.status(500).json({ error: "Internal server error" });
        console.log("Error in editPost controller: ", error);
    }
});

// Comment on post
app.post("/comment/:id", checkAuthenticated, async (req, res) => 
{
    try
    {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._conditions._id.toString();
        const currentTime = new Date().toISOString();

        if (!text)
        {
            return res.status(400).json({ error: "Text field is required" });
        }
        
		const post = await postsCollection.findById(postId);
		if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

		const comment = { user: userId, text, createdAt: currentTime};
		post.comments.push(comment);
		await post.save();

        if (userId.toString() !== post.user.toString())
        {
            const notification = new notificationsCollection({
                from: userId,
                fromName: req.user._conditions.name,
                to: post.user,
                type: "comment",
                post: postId,
            });
            await notification.save();
        }

		res.status(200).json(post);
	}
    catch (error)
    {
        console.log("Error in commentOnPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Edit comment on post
app.patch("/edit-comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
{
    try
    {
        const { text } = req.body;
        const { postId, commentId } = req.params;
        const userId = req.user._conditions._id.toString();
        const user = await userCollection.findById(req.user._conditions._id);

        if (!text)
        {
            return res.status(400).json({ error: "Text field is required" });
        }

        const post = await postsCollection.findById(postId);
        if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        if (!comment)
        {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.user.toString() !== userId && !user.admin)
        {
            return res.status(403).json({ error: "You are not authorized to edit this comment" });
        }

        comment.text = text;
        await post.save();

        res.status(200).json(post);
    }
    catch (error)
    {
        console.log("Error in editComment controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete comment on post
app.delete("/delete-comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
{
    try
    {
        const { postId, commentId } = req.params;
        const userId = req.user._conditions._id.toString();
        const post = await postsCollection.findById(postId);
        const user = await userCollection.findById(req.user._conditions._id);

        if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(commentId);

        if (!comment)
        {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.user.toString() !== userId  && !user.admin)
        {
            return res.status(403).json({ error: "You are not authorized to delete this comment" });
        }

        post.comments = post.comments.filter(c => c.id !== commentId);
        await post.save();

        res.status(200).json(post);
    }
    catch (error)
    {
        console.log("Error in deleteComment controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Edit comment on post
app.patch("/edit-comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
{
    try
    {
        const { text } = req.body;
        const { postId, commentId } = req.params;
        const userId = req.user._conditions._id.toString();
        const user = await userCollection.findById(req.user._conditions._id);

        if (!text)
        {
            return res.status(400).json({ error: "Text field is required" });
        }

        const post = await postsCollection.findById(postId);
        if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        if (!comment)
        {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.user.toString() !== userId && !user.admin)
        {
            return res.status(403).json({ error: "You are not authorized to edit this comment" });
        }

        comment.text = text;
        await post.save();

        res.status(200).json(post);
    }
    catch (error)
    {
        console.log("Error in editComment controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete comment on post
app.delete("/delete-comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
{
    try
    {
        const { postId, commentId } = req.params;
        const userId = req.user._conditions._id.toString();
        const post = await postsCollection.findById(postId);
        const user = await userCollection.findById(req.user._conditions._id);

        if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(commentId);

        if (!comment)
        {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.user.toString() !== userId  && !user.admin)
        {
            return res.status(403).json({ error: "You are not authorized to delete this comment" });
        }

        post.comments = post.comments.filter(c => c.id !== commentId);
        await post.save();

        res.status(200).json(post);
    }
    catch (error)
    {
        console.log("Error in deleteComment controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Reply on comment
app.post("/comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
{
    try
    {
        const { text } = req.body;
        const postId = req.params.postId;
        const commentId = req.params.commentId;
        const userId = req.user._conditions._id.toString();
        const currentTime = new Date().toISOString();

        if (!text)
        {
            return res.status(400).json({ error: "Text field is required" });
        }
        
        const post = await postsCollection.findById(postId);
        if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        if (!comment)
        {
            return res.status(404).json({ error: "Comment not found" });
        }

        const newComment = { user: userId, text, createdAt: currentTime };

        comment.comments.push(newComment);
        await post.save();
        
        if (userId.toString() !== comment.user.toString() &&
        post.user.toString() === comment.user.toString())
        {
            const notification = new notificationsCollection({
                from: userId,
                fromName: req.user._conditions.name,
                to: post.user,
                type: "reply",
                post: postId,
            });
            await notification.save();
        }

        res.status(200).json(post);
    }
    catch (error)
    {
        console.log("Error in commentOnComment controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Edit reply on comment
app.patch("/edit-reply/:postId/:commentId/:replyId", checkAuthenticated, async (req, res) =>
{
    try
    {
        const { text } = req.body;
        const { postId, commentId, replyId } = req.params;
        const userId = req.user._conditions._id.toString();
        const user = await userCollection.findById(req.user._conditions._id);

        if (!text)
        {
            return res.status(400).json({ error: "Text field is required" });
        }

        const post = await postsCollection.findById(postId);
        if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        if (!comment)
        {
            return res.status(404).json({ error: "Comment not found" });
        }

        const reply = comment.comments.id(replyId);
        if (!reply)
        {
            return res.status(404).json({ error: "Reply not found" });
        }

        if (reply.user.toString() !== userId && !user.admin)
        {
            return res.status(403).json({ error: "You are not authorized to edit this reply" });
        }

        reply.text = text;
        await post.save();

        res.status(200).json(post);
    }
    catch (error)
    {
        console.log("Error in editReply controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete reply on comment
app.delete("/delete-reply/:postId/:commentId/:replyId", checkAuthenticated, async (req, res) =>
{
    try
    {
        const { postId, commentId, replyId } = req.params;
        const userId = req.user._conditions._id.toString();
        const post = await postsCollection.findById(postId);
        const user = await userCollection.findById(req.user._conditions._id);

        if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        if (!comment)
        {
            return res.status(404).json({ error: "Comment not found" });
        }

        const reply = comment.comments.id(replyId);
        if (!reply)
        {
            return res.status(404).json({ error: "Reply not found" });
        }

        if (reply.user.toString() !== userId  && !user.admin)
        {
            return res.status(403).json({ error: "You are not authorized to delete this reply" });
        }

        comment.comments = comment.comments.filter(r => r.id !== replyId);
        await post.save();

        res.status(200).json(post);
    }
    catch (error)
    {
        console.log("Error in deleteReply controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Like or unlike post
app.post("/like/:id", checkAuthenticated,  async (req, res) =>
{
    try
    {
		const userId = req.user._conditions._id;
		const { id: postId } = req.params;
		const post = await postsCollection.findById(postId);

		if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost)
        {
            // Unlike post
			await postsCollection.updateOne({ _id: postId }, { $pull: { likes: userId } });
			await userCollection.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
            await notificationsCollection.findOneAndDelete({
                from: userId,
                fromName: req.user._conditions.name,
                to: post.user,
                type: "like",
                post: postId
            });

			const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
			res.status(200).json(updatedLikes);
		}
        else
        {
            // Like post
            post.likes.push(userId);
            await userCollection.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
            await post.save();

            if (userId.toString() !== post.user.toString())
            {
                const notification = new notificationsCollection({
                    from: userId,
                    fromName: req.user._conditions.name,
                    to: post.user,
                    type: "like",
                    post: postId,
                });
                await notification.save();
            }

            const updatedLikes = post.likes;
            res.status(200).json(updatedLikes);
        }
    }
    catch (error)
    {
        console.log("Error in likeUnlikePost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// like or unlike comment
app.post("/like-comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
{
    try
    {
        const userId = req.user._conditions._id;
        const { postId, commentId } = req.params;

        const post = await postsCollection.findById(postId);

        if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(commentId);

        if (!comment)
        {
            return res.status(404).json({ error: "Comment not found" });
        }

        const userLikedComment = comment.likes.includes(userId);

        if (userLikedComment)
        {
            comment.likes.pull(userId);
            await post.save();

            await notificationsCollection.findOneAndDelete({
                from: userId,
                to: comment.user,
                type: "like comment",
                post: postId,
                comment: commentId,
            });

            const updatedLikes = comment.likes;
            res.status(200).json(updatedLikes);
        }
        else
        {
            comment.likes.push(userId);
            await post.save();

            if (userId.toString() !== comment.user.toString())
            {
                const notification = new notificationsCollection({
                    from: userId,
                    to: comment.user,
                    type: "like comment",
                    post: postId,
                    comment: commentId,
                });
                await notification.save();
            }

            const updatedLikes = comment.likes;
            res.status(200).json(updatedLikes);
        }
    } 
    catch (error)
    {
        console.log("Error in likeUnlikeComment controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/like-reply/:postId/:commentId/:replyId", checkAuthenticated, async (req, res) =>
{
    try
    {
        const userId = req.user._conditions._id;
        const { postId, commentId, replyId } = req.params;

        const post = await postsCollection.findById(postId);
        if (!post)
        {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        if (!comment)
        {
            return res.status(404).json({ error: "Comment not found" });
        }

        const reply = comment.comments.id(replyId);
        if (!reply)
        {
            return res.status(404).json({ error: "reply not found" });
        }

        const userLikedreply = reply.likes.includes(userId);
        if (userLikedreply)
        {
            reply.likes.pull(userId);
            await post.save();

            await notificationsCollection.findOneAndDelete({
                from: userId,
                to: reply.user,
                type: "like comment",
                post: postId,
                comment: commentId,
            });

            const updatedLikes = reply.likes;
            res.status(200).json(updatedLikes);
        } 
        else
        {
            reply.likes.push(userId);
            await post.save();

            if (userId.toString() !== reply.user.toString())
            {
                const notification = new notificationsCollection({
                    from: userId,
                    to: reply.user,
                    type: "like comment",
                    post: postId,
                    comment: commentId,
                });
                await notification.save();
            }

            const updatedLikes = reply.likes;
            res.status(200).json(updatedLikes);
        }
    }
    catch (error)
    {
        console.log("Error in likeUnlikereply controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/getProgress", async (req, res) =>
{
    try
    {
        // const allUsers = await userCollection.find({ trackMod: { $exists: false } });
        const allUsers = await userCollection.find({
            $and: [
                { trackMod: { $exists: false } },
                { $or: [ { cohort: 2 }, { cohort: { $exists: false } } ] }
            ]
        });
        let totalValueArray = [];

        for (let i = 0; i < allUsers.length; i++)
        {
            if (allUsers[i].name !== 
                "Micah Bessolo" && allUsers[i].name !== "Dani Rod"
                && allUsers[i].name !== "Stephen Jiroch" && allUsers[i].name !== "test sixteen"
                && allUsers[i].name !== "Lotte Leers" && allUsers[i].name !== "Jill Langley"
                && allUsers[i].name !== "Jonah Magness" && allUsers[i].name !== "Danielle Rodr"
                && allUsers[i].name !== "Dani R" && allUsers[i].name !== "D Rod"
                && allUsers[i].name !== "Dani R" && allUsers[i].name !== "Dani Rodriguez"
                && allUsers[i].name !== "Noam Koren" && allUsers[i].name !== "Stephen"
                && allUsers[i].name !== "Testing Tester" && allUsers[i].name !== "Edward Mann"
            )
            {
                let object = allUsers[i];

                const track1 = ["_1_1", "_1_2", "_1_3", "_1_4", "_1_5", "_1_6", "_1_7", "_1_8", "_1_9", "_1_10", "_1_11", "_1_12", "_1_13", "_1_14", "_1_15", "_1_16"];
                const track2 = ["_2_1", "_2_2", "_2_3", "_2_4", "_2_5", "_2_6", "_2_7", "_2_8", "_2_9", "_2_10", "_2_11"];
                const track3 = ["_3_1", "_3_2", "_3_3", "_3_4", "_3_5", "_3_6", "_3_7", "_3_8", "_3_9", "_3_10"];
    
                let values1 = track1.map(key => object[key]);
                let values2 = track2.map(key => object[key]);
                let values3 = track3.map(key => object[key]);
    
                value1Total = 0;
                for (let i = 0; i < values1.length; i++)
                {
                    for (let j = 0; j < values1[i].length; j++)
                    {
                        if (values1[i][j] !== "")
                        {
                            if (values1[i][j].split('_')[2] !== "NaN" && values1[i][j].split('_')[2] !== "Infinity")
                            {
                                value1Total += Number(values1[i][j].split('_')[2]);
                            }
                        }
                    }
                }
    
                value2Total = 0;
                for (let i = 0; i < values2.length; i++)
                {
                    for (let j = 0; j < values2[i].length; j++)
                    {
                        if (values2[i][j] !== "")
                        {
                            if (values2[i][j].split('_')[2] !== "NaN" && values2[i][j].split('_')[2] !== "Infinity")
                            {
                                value2Total += Number(values2[i][j].split('_')[2]);
                            }
                        }
                    }
                }
    
                value3Total = 0;
                for (let i = 0; i < values3.length; i++)
                {
                    for (let j = 0; j < values3[i].length; j++)
                    {
                        if (values3[i][j] !== "")
                        {
                            if (values3[i][j].split('_')[2] !== "NaN" && values3[i][j].split('_')[2] !== "Infinity")
                            {
                                value3Total += Number(values3[i][j].split('_')[2]);
                            }
                        }
                    }
                }
                const clientValue = [object.name, (value1Total/183 * 100).toFixed(2), (value2Total/61 * 100).toFixed(2), (value3Total/59 * 100).toFixed(2)];
                totalValueArray.push(clientValue)
            }
        }
        res.status(200).json(totalValueArray);
    }
    catch (error)
    {
        console.log("Error in getProgress controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// finds average lesson progress for each lesson
app.get("/getLessonProgress", async (res) =>
{
    try
    {
        const allUsers = await userCollection.find({ trackMod: { $exists: false } });
        let totalValueArray = [];

        for (let i = 0; i < allUsers.length; i++)
        {
            if (allUsers[i].name !== 
                "Micah Bessolo" && allUsers[i].name !== "Dani Rod"
                && allUsers[i].name !== "Stephen Jiroch" && allUsers[i].name !== "test sixteen"
                && allUsers[i].name !== "Lotte Leers" && allUsers[i].name !== "Jill Langley"
                && allUsers[i].name !== "Jonah Magness" && allUsers[i].name !== "Danielle Rodr"
                && allUsers[i].name !== "Dani R" && allUsers[i].name !== "D Rod"
                && allUsers[i].name !== "Dani R" && allUsers[i].name !== "Dani Rodriguez"
                && allUsers[i].name !== "Noam Koren" && allUsers[i].name !== "Stephen"
                && allUsers[i].name !== "Testing Tester" && allUsers[i].name !== "Edward Mann"
            )
            {
                let object = allUsers[i];

                const track1 = ["_1_1", "_1_2", "_1_3", "_1_4", "_1_5", "_1_6", "_1_7", "_1_8", "_1_9", "_1_10", "_1_11", "_1_12", "_1_13", "_1_14", "_1_15", "_1_16"];
                const track2 = ["_2_1", "_2_2", "_2_3", "_2_4", "_2_5", "_2_6", "_2_7", "_2_8", "_2_9", "_2_10", "_2_11"];
                const track3 = ["_3_1", "_3_2", "_3_3", "_3_4", "_3_5", "_3_6", "_3_7", "_3_8", "_3_9", "_3_10"];
    
                let values1 = track1.map(key => object[key]);
                let values2 = track2.map(key => object[key]);
                let values3 = track3.map(key => object[key]);

                let value1Array = [];
                let value2Array = [];
                let value3Array = [];

                processTrack(values1, track1, value1Array);
                processTrack(values2, track2, value2Array);
                processTrack(values3, track3, value3Array);

                totalValueArray.push(value1Array);
                totalValueArray.push(value2Array);
                totalValueArray.push(value3Array);
            }
        }

        const averageProgressArray = calculateAverageProgress(totalValueArray);
        res.status(200).json(averageProgressArray);
    }
    catch (error)
    {
        console.log("Error in getProgress controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

function processTrack(values, track, valueArray)
{
    for (let i = 0; i < values.length; i++)
    {
        for (let j = 0; j < values[i].length; j++)
        {
            let valueObject = {};

            if (values[i][j] !== "")
            {
                if (values[i][j].split('_')[2] !== "NaN" && values[i][j].split('_')[2] !== "Infinity" && values[i][j].split('_')[2] !== null)
                {
                    let trackValue = track[i].split('_')[1];
                    let moduleValue = track[i].split('_')[2];
                    valueObject.lesson = `track: ${trackValue} module: ${moduleValue} lesson: ${Number(j) + 1}`;
                    valueObject.progress = Number(values[i][j].split('_')[2]);
                }
            }
            else
            {
                if (values[i][j].split('_')[2] !== "NaN" && values[i][j].split('_')[2] !== "Infinity" && values[i][j].split('_')[2] !== null)
                {
                    let trackValue = track[i].split('_')[1];
                    let moduleValue = track[i].split('_')[2];
                    valueObject.lesson = `track: ${trackValue} module: ${moduleValue} lesson: ${Number(j) + 1}`;
                    valueObject.progress = 0;
                }
            }
            if (valueObject.progress !== null && valueObject.progress !== undefined)
            {
                valueArray.push(valueObject);
            }
        }
    }
}

function calculateAverageProgress(totalValueArray)
{
    // Flatten the array of arrays into a single array
    const flattenedArray = totalValueArray.flat();

    // Create a map to group by lesson
    const lessonMap = new Map();

    flattenedArray.forEach(item => {
        const { lesson, progress } = item;
        if (!lessonMap.has(lesson)) {
            lessonMap.set(lesson, { totalProgress: 0, count: 0 });
        }
        const lessonData = lessonMap.get(lesson);
        lessonData.totalProgress += progress;
        lessonData.count += 1;
    });

    // Create the result array with average progress
    const resultArray = [];
    lessonMap.forEach((value, key) =>
    {
        resultArray.push({
            lesson: key,
            progress: value.totalProgress / value.count
        });
    });

    // Sort the result array by progress in descending order
    resultArray.sort((a, b) => b.progress - a.progress);

    return resultArray;
}

app.get("/name/:id", async (req, res) =>
{
    try
    {
        const user = await userCollection.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        res.status(200).json(user.name);
    }
    catch (error)
    {
        console.log("Error in getName controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete post
app.delete("/:id", checkAuthenticated, async (req, res) =>
{
    try
    {
		const post = await postsCollection.findById(req.params.id);
        const user = await userCollection.findById(req.user._conditions._id);

		if (post.user.toString() !== req.user._conditions._id.toString() && !user.admin)
        {
            return res.status(401).json({ error: "You are not authorized to delete this post" });
        }

        if (post.img)
        {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await postsCollection.findByIdAndDelete(req.params.id);
        await notificationsCollection.deleteMany({ post: req.params.id });

        res.status(200).json({ message: "Post deleted successfully" });
    }
    catch (error)
    {
        console.log("Error in deletePost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Pin postt
app.get("/pin/:id", checkAuthenticated, async (req, res) =>
{
    try
    {
        const post = await postsCollection.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const user = await userCollection.findById(req.user._conditions._id);
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.admin) return res.status(401).json({ error: "You are not authorized to pin this post" });

        post.pin = !post.pin;
        await post.save();

        res.status(200).json(post.pin);
    }
    catch (error)
    {
        console.log("Error in pinPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// add post to guides
app.get("/guide/:id", checkAuthenticated, async (req, res) =>
{
    try
    {
        const post = await postsCollection.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const user = await userCollection.findById(req.user._conditions._id);
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.admin) return res.status(401).json({ error: "You are not authorized to add this post" });

        post.resource = !post.resource;
        await post.save();

        res.status(200).json(post.resource);
    }
    catch (error)
    {
        console.log("Error in guides controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// get guides posts
app.get("/guides", checkAuthenticated, async (req, res) =>
{
    try
    {
        const guides = await postsCollection.find({ resource: true }).sort({ createdAt: -1 });
        res.status(200).json(guides);
    }
    catch (error)
    {
        res.status(500).json({ error: "Internal server error" });
        console.log("Error in /guides route: ", error);
    }
});

// get user list from input
app.get("/user-array/:username", checkAuthenticated, async (req, res) =>
{
    try
    {
        const username = req.params.username;
        user = await userCollection.find({ name: { $regex: username, $options: 'i' } });
        
        const userLength = user.length
        let userResult = [];

        if (userLength > 0)
        {
            for (let i = 0; i < userLength; i++)
            {
                let userObject = {};
                userObject.name = user[i].name;
                userObject.profileImg = user[i].profileImg;
                userResult.push(userObject);
            }
        }

        res.status(200).json(userResult);
    }
    catch (error)
    {
        console.log("Error in getUserPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// get posts by a date range
app.get("/posts-by-date-range/:dateRange", checkAuthenticated, async (req, res) => 
{
    try
    {
        const dateRange = req.params.dateRange;
        const [startDateStr, endDateStr] = dateRange.split(' - ');
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const posts = await postsCollection.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ createdAt: -1 });

        res.status(200).json(posts);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// get posts by search input
app.get("/posts-by-search/:searchInput", checkAuthenticated, async (req, res) => 
{
    try
    {
        const searchInput = req.params.searchInput;
        const posts = await postsCollection.find({
            $or: [
                { text: { $regex: searchInput, $options: 'i' } },
                { pdfName: { $regex: searchInput, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json(posts);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Pin post
app.get("/pin/:id", checkAuthenticated, async (req, res) =>
{
    try
    {
        const post = await postsCollection.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const user = await userCollection.findById(req.user._conditions._id);
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.admin) return res.status(401).json({ error: "You are not authorized to pin this post" });

        post.pin = !post.pin;
        await post.save();

        res.status(200).json(post.pin);
    }
    catch (error)
    {
        console.log("Error in pinPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// add post to guides
app.get("/guide/:id", checkAuthenticated, async (req, res) =>
{
    try
    {
        const post = await postsCollection.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const user = await userCollection.findById(req.user._conditions._id);
        if (!user) return res.status(404).json({ error: "User not found" });
        if (!user.admin) return res.status(401).json({ error: "You are not authorized to add this post" });

        post.resource = !post.resource;
        await post.save();

        res.status(200).json(post.resource);
    }
    catch (error)
    {
        console.log("Error in guides controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// add post to guides
app.get("/guides", checkAuthenticated, async (req, res) =>
{
    try
    {
        const guides = await postsCollection.find({ resource: true }).sort({ createdAt: -1 });
        res.status(200).json(guides);
    }
    catch (error)
    {
        res.status(500).json({ error: "Internal server error" });
        console.log("Error in /guides route: ", error);
    }
});

app.get("/user-array/:username", checkAuthenticated, async (req, res) =>
{
    try
    {
        const username = req.params.username;
        user = await userCollection.find({ name: { $regex: username, $options: 'i' } });
        
        const userLength = user.length
        let userResult = [];

        if (userLength > 0)
        {
            for (let i = 0; i < userLength; i++)
            {
                let userObject = {};
                userObject.name = user[i].name;
                userObject.profileImg = user[i].profileImg;
                userResult.push(userObject);
            }
        }

        res.status(200).json(userResult);
    }
    catch (error)
    {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/posts-by-date-range/:dateRange", checkAuthenticated, async (req, res) => 
{
    try
    {
        const dateRange = req.params.dateRange;
        const [startDateStr, endDateStr] = dateRange.split(' - ');
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const posts = await postsCollection.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ createdAt: -1 });

        res.status(200).json(posts);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// get posts by search input
app.get("/posts-by-search/:searchInput", checkAuthenticated, async (req, res) => 
{
    try
    {
        const searchInput = req.params.searchInput;
        const posts = await postsCollection.find({
            $or: [
                { text: { $regex: searchInput, $options: 'i' } },
                { pdfName: { $regex: searchInput, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json(posts);
    }
    catch (error)
    {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get user posts
app.get("/user/:username", checkAuthenticated, async (req, res) =>
{
    try
    {
        const username = req.params.username;

		let user = await userCollection.findOne({ name: username });

        if (!user) return res.status(404).json({ error: "User not found" });

        const posts = await postsCollection.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10",
            })
            .populate({
                path: "comments.user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10",
            });

        res.status(200).json(posts);
    }
    catch (error)
    {
        console.log("Error in getUserPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get liked posts
app.get("/likes/:id", checkAuthenticated, async (req, res) =>
{
    const userId = req.user._conditions._id;

    try
    {
        const user = await userCollection.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const likedPosts = await postsCollection.find({ _id: { $in: user.likedPosts } })
            .populate({
                path: "user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10",
            })
            .populate({
                path: "comments.user",
                select: "-password -resetLink -likedVideos -email -_1_1 -_1_2 -_1_3 -_1_4 -_1_5 -_1_6 -_1_7 -_1_8 -_1_9 -_1_10 -_1_11 -_1_12 -_1_13 -_1_14 -_1_15 -_1_16 -_2_1 -_2_2 -_2_3 -_2_4 -_2_5 -_2_6 -_2_7 -_2_8 -_2_9 -_2_10 -_2_11 -_3_1 -_3_2 -_3_3 -_3_4 -_3_5 -_3_6 -_3_7 -_3_8 -_3_9 -_3_10",
            });

        res.status(200).json(likedPosts);
    }
    catch (error)
    {
        console.log("Error in getLikedPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/favorites', async (req, res) =>
{
    let likedVideos;

    try
    {
        await userCollection.findOne({_id: req.user._conditions._id}).then((info) =>
        {
            likedVideos = info.likedVideos;
        });
    
        res.render('favorites.ejs', {likedVideos: likedVideos});
    }
    catch
    {
        res.render('login.ejs')
    }
});

app.get('/terms-and-conditions', (req, res) => 
{
    res.render('terms-and-conditions.ejs');
});

app.get('/privacy-policy', (req, res) => 
{
    res.render('privacy-policy.ejs');
});

// save video progress and percentage complete
app.patch('/video-state:videoState', async (req, res) =>
{
    try
    {
        const user = await userCollection.findOne({_id: req.user._conditions._id});
        if (!user) throw new Error('User not found');

        const currentTime = JSON.parse(JSON.stringify(req.body)).currentTime;
        const videoDuration = JSON.parse(JSON.stringify(req.body)).videoDuration;
        const URLData = JSON.parse(JSON.stringify(req.body)).URLData;
        const sectionArray = `_${URLData.split('-')[0]}_${URLData.split('-')[1]}`;
        let Lesson = Number(URLData.split('-')[2]) - 1;
        if (Lesson === -1)
        {
            Lesson = 0;
        }
        let isNewKey = false;

        // Ensure sectionArray and Lesson are defined
        if (!user[sectionArray])
        {
            user[sectionArray] = [];
            isNewKey = true;
        }
        if (!user[sectionArray][Lesson])
        {
            user[sectionArray][Lesson] = '';
        }

        // Video Complete Marked
        if (currentTime === videoDuration)
        {
            user[sectionArray][Lesson] = `${currentTime}_${videoDuration}_${1}`;

            if (isNewKey)
            {
                await userCollection.findOneAndUpdate(
                    { email: user.email },
                    { $set: { [sectionArray]: [user[sectionArray][Lesson]] } },
                    { new: true }
                );
            }
            else
            {
                await userCollection.findOneAndUpdate({email: user.email}, user, {new: true});
            }
        }
        else
        {
            let percentageComplete = Number(currentTime) / Number(videoDuration);
            percentageComplete = percentageComplete.toFixed(2);

            // Only updates if the new progress is higher than the initial progress
            if (typeof user[sectionArray][Lesson] === "undefined" || user[sectionArray][Lesson] === "" ||
                Number(user[sectionArray][Lesson].split('_')[2]) < percentageComplete)
            {
                user[sectionArray][Lesson] = `${currentTime}_${videoDuration}_${percentageComplete}`;

                if (isNewKey)
                {
                    let result = await userCollection.findOneAndUpdate(
                        { email: user.email },
                        { $set: { [sectionArray]: [user[sectionArray][Lesson]] } },
                        { new: true }
                    );
                }
                else
                {
                    await userCollection.findOneAndUpdate({email: user.email}, user, {new: true});
                }
            }
        }
        return res.json({
            message: 'state updated'
        });
    }
    catch (err)
    {
        console.log("didn't work: " + err);
        res.status(500).send('An error occurred while updating the video state.');
    }
});

app.patch('/live-trainings-state:videoState', async (req, res) =>
{
    let email;
    let liveTrainingsProgress
    
    await userCollection.findOne({_id: req.user._conditions._id}).then((info) => 
    {
        email = info.email;
        liveTrainingsProgress = info.liveTrainingsProgress;
    });

    const currentTime = JSON.parse(JSON.stringify(req.body)).currentTime;
    const videoDuration = JSON.parse(JSON.stringify(req.body)).videoDuration;
    const URLData = JSON.parse(JSON.stringify(req.body)).URLData;
    const Training = Number(URLData) - 1;
    let percentageComplete = Number(currentTime)/Number(videoDuration);
    percentageComplete = percentageComplete.toFixed(2);

    while (liveTrainingsProgress.length <= Training)
    {
        liveTrainingsProgress.push("");
    }

    // Update the specific training progress
    liveTrainingsProgress[Training] = `${currentTime}_${videoDuration}_${percentageComplete}`;

    let data =
    {
        liveTrainingsProgress: liveTrainingsProgress
    };

    const newState = await userCollection.findOneAndUpdate({email: email}, data, {new: true});
    res.send(newState);
});

// save favorites
app.patch('/favorites:liked', async (req, res) =>
{
    let likedVideos;
    let email; 
    
    try
    {
        await userCollection.findOne({_id: req.user._conditions._id}).then((info) =>
        {
            likedVideos = info.likedVideos;
            email = info.email;
        });
    
        const likedVid = `${JSON.parse(JSON.stringify(req.body)).likedVid}`; // module/lesson
        const isLiked = JSON.parse(JSON.stringify(req.body)).isLiked; // true or false
        let replace = false;
    
        // adds liked video to the array
        if (isLiked === "false" || isLiked === false)
        {
            if (!likedVideos.includes(likedVid))
            {
                for (let i = 0; i < likedVideos.length; i++)
                {
                    if (likedVideos[i] !== "")
                    {
                        if (i === Number(likedVideos.length - 1)) // last video
                        {
                            replace = true;
                        }
                    }
                    else if (likedVideos[i] === "")
                    {
                        likedVideos[i] = likedVid;
                        break;
                    }
                    else {}
                }
            }
        }
        // removes disliked video from the array
        else if (isLiked === "true" || isLiked === true)
        {
            if (likedVideos.includes(likedVid))
            {
                // removes disliked video, adds a new empty string to end
                let index = Number(likedVideos.indexOf(likedVid));
                likedVideos.splice(index, 1);
                likedVideos.push("");
            }
        }
        
        if (replace)
        {
            try
            {
                await userCollection.findOneAndUpdate({email: email}, { $addToSet: {likedVideos: likedVid}});
            }
            catch(err)
            {
                console.log("didn't work: " + err);
            }
        
            return res.json({
                message: 'state updated'
            });
        }
        else
        {
            try
            {
                let data = 
                {
                    likedVideos: likedVideos,
                };
    
                await userCollection.findOneAndUpdate({email: email}, data, {new: true});
            }
            catch(err)
            {
                console.log("didn't work: " + err);
            }
    
            return res.json({
                message: 'state updated'
            });
        }   
    }
    catch
    {}     
});

app.get('/course', async (req, res) =>
{
    try 
    {
        const user = await userCollection.findOne({_id: req.user._conditions._id});
        if (!user) throw new Error('User not found');

        const data = { likedVideos: user.likedVideos };
        for (let i = 0; i <= 16; i++)
        {
            data[`_1_${i}`] = user[`_1_${i}`];
        }
        for (let i = 1; i <= 11; i++)
        {
            data[`_2_${i}`] = user[`_2_${i}`];
        }
        for (let i = 1; i <= 10; i++)
        {
            data[`_3_${i}`] = user[`_3_${i}`];
        }

        res.render('course.ejs', data);
    }
    catch
    {
        res.render('login.ejs');
    }
});

// gets list of video titles with their links
app.get('/videoList/:lesson', async (req, res) => 
{
    const lesson = req.params.lesson.toString();
    let videoList;

    if(lesson.includes('-'))
    {
        videoList = await videosCollection.findOne({trackMod: lesson}).then((data) =>
        {
            return data;
        });
    }
    else
    {
        videoList = await videosCollection.findOne({trackMod: "Live Trainings"}).then((data) =>
        {
            return data;
        });
    }
    
    res.json(videoList);
});

app.get('/track1', async (req, res) =>
{
    try
    {
        const user = await userCollection.findOne({_id: req.user._conditions._id});
        if (!user) throw new Error('User not found');

        const data = {};
        for (let i = 0; i <= 16; i++)
        {
            data[`_1_${i}`] = user[`_1_${i}`];
        }

        res.render('track1.ejs', data);
    } 
    catch
    {
        res.render('login.ejs');
    }
});

app.get('/track2', async (req, res) =>
{
    try
    {
        const user = await userCollection.findOne({_id: req.user._conditions._id});
        if (!user) throw new Error('User not found');

        const data = {};
        for (let i = 1; i <= 11; i++)
        {
            data[`_2_${i}`] = user[`_2_${i}`];
        }

        res.render('track2.ejs', data);
    } 
    catch
    {
        res.render('login.ejs');
    }
});

app.get('/track3', async (req, res) =>
{
    try
    {
        const user = await userCollection.findOne({_id: req.user._conditions._id});
        if (!user) throw new Error('User not found');

        const data = {};
        for (let i = 1; i <= 10; i++)
        {
            data[`_3_${i}`] = user[`_3_${i}`];
        }

        res.render('track3.ejs', data);
    }
    catch
    {
        res.render('login.ejs');
    }
});

app.listen(PORT, () => 
{
    console.log(`Server started on http://localhost:${PORT}`);
    connectMongoDB();
});