if ((process.env.NODE_ENV || '').trim() !== 'production')
{
    require('dotenv').config();
}
else
{
    console.log("we in prod boiii")
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const collection = require("./mongodb");
const initializePassport = require('./passport-config');
const {forgotPassword, resetPassword} = require("./password_recovery/auth");
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

initializePassport(passport, 
    email => collection.findOne({email: email}),
    id => collection.findOne({_id: id})
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
app.use(passport.session());
app.use(methodOverride('_method'));

let userEmail;

app.get('/', checkAuthenticated, async (req, res) =>
{
    let videoTime;
    const userName = await collection.findOne({_id: req.user._conditions._id}).then((user, err) =>
    {
        userEmail = user.email;
        videoTime = user.videoState;
        return user.name;
    });

    res.render('library.ejs', { name: userName, videoState: videoTime });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password.ejs');
});

app.post('/forgot-password', forgotPassword);

app.get('/reset-password', (req, res) => {
    res.render('reset-password.ejs');
});

app.post('/reset-password', resetPassword);

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, (req, res) =>
{
    collection.findOne({email: req.body.email}).then(async (user, err) => 
    {
        if (user)
        {
            return res.status(400).json({error: "User with this email already exists."});
        }

        try
        {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const data = 
                {
                    createdDate: Date.now().toString(),
                    name: req.body.name,
                    email: req.body.email,
                    password: hashedPassword,
                    videoState: ''
                }
            await collection.insertMany([data]);
            res.redirect('/login');
        }
        catch
        {
            res.redirect('/register');
        }
    });
});

app.patch('/video-state:videoState', async (req, res) =>
{
    console.log(userEmail);

    let password;
    let email; 
    let userName;
    let createdDate;

    const results = await collection.find({email: userEmail}).then((info, err) =>
    {
        password = info[0].password;
        email = info[0].email;
        userName = info[0].name;
        createdDate = info[0].createdDate
    });

    const videoState = JSON.parse(JSON.stringify(req.body)).sectionTime;

    try
    {
        const data = 
        {
            password: password,
            email: email,
            name: userName,
            createdDate: createdDate,
            videoState: videoState
        }

        const newState = await collection.findOneAndUpdate({email: email},data, {new: true});
        console.log(newState)
    }
    catch
    {
        console.log("didn't work");
    }

    return res.json({
        message: 'state updated'
    });
});

app.delete('/logout', (req, res) =>
{
    req.logout(req.user, err =>
    {
        if(err) return next(err);
        res.redirect("/login");
    });
});

function checkAuthenticated(req, res, next)
{
    if (req.isAuthenticated())
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

//payment setup

app.get('/success', (req, res) => {
    res.render('success.ejs');
});

app.get('/cancel', (req, res) => {
    res.render('cancel.ejs');
});

const storeItems = new Map([
    [1, { priceInCents: 300000, name: "course" }]
]);

app.get('/create-checkout-session', (req, res) => {
    res.render('checkout.ejs');
})

app.post('/create-checkout-session', async (req, res) => {
   try {
    const session = await stripe.checkout.sessions.create(
    {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: req.body.items?.map(item => 
        {
            const  storeItem = storeItems.get(item.id)
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: storeItem.name
                    },
                    unit_amount: storeItem.priceInCents
                },
                quantity: item.quantity
            }
        }),
        success_url: `${process.env.CLIENT_URL}/success`,
        cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });
    res.json({ url: session.url });
   } catch (e) {
    res.status(500).json({ error: e.message });
   }
});

app.get('/course', (req, res) => {
    res.render('course.ejs');
});

app.listen(3000);