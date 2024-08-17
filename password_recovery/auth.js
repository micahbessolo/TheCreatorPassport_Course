const userCollections = require('./models/user-collection');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const mailgun = require("mailgun-js");
// const DOMAIN = 'sandboxce966cd0186342eba02597c12a52c3d0.mailgun.org';
const DOMAIN = 'mg.thecreatorpassport.com';
const bcrypt = require('bcrypt');
const axios = require('axios').default;
const mg = mailgun({apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN});

// sends forgot-password email with link including token
exports.forgotPassword = async (req, res) =>
{
    let userName;

    await userCollections.findOne({email: req.body.email}).then((user, err) =>
    {
        userName = user.name;

        if(err || !user)
        {
            return res.render('forgot-password.ejs', { messages: 'No user with that email' });
        }

        const token = jwt.sign({_id: user._id}, process.env.RESET_PASSWORD_KEY, {expiresIn: '20m'});

        const data =
        {
            from: 'noreply@theloverspassport.com',
            to: req.body.email,
            subject: 'Password Reset',
            html: `
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta name="x-apple-disable-message-reformatting" />
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <meta name="color-scheme" content="light dark" />
                <meta name="supported-color-schemes" content="light dark" />
                <title></title>
                <style type="text/css" rel="stylesheet" media="all">
                /* Base ------------------------------ */
                
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
                                    <h1>Hi ${user.name},</h1>
                                    <p>You recently requested to reset your password for your Lovers Passport course account. Use the button below to reset it. <strong>This password reset is only valid for the next 20 minutes</strong></p>
                                    <!-- Action -->
                                    <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                        <td align="center">
                                        <!-- Border based button
                    https://litmus.com/blog/a-guide-to-bulletproof-buttons-in-email-design -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                            <tr>
                                            <td align="center">
                                                <a href="${process.env.CLIENT_URL}/reset-password/?access_token=${token}" class="f-fallback button button--green" target="_blank">Reset your password</a>
                                            </td>
                                            </tr>
                                        </table>
                                        </td>
                                    </tr>
                                    </table>
                                    <p>If you did not request a password reset, please ignore this email or <a href="{{support_url}}">contact us</a> if you have questions.</p>
                                    <p>Thanks,
                                    <br>The Lovers Passport team</p>
                                    <!-- Sub copy -->
                                    <table class="body-sub" role="presentation">
                                    <tr>
                                        <td>
                                        <p class="f-fallback sub">If you’re having trouble with the button above, copy and paste the URL below into your web browser.</p>
                                        <p class="f-fallback sub">${process.env.CLIENT_URL}/reset-password/?access_token=${token}</p>
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
                return res.render('forgot-password.ejs', { messages: 'reset password link error' });
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
                    return res.render('forgot-password.ejs', { messages: 'Email has been sent, kindly follow the instructions' });
                });
            }
        });
    });
}

// verifies token link
exports.resetPassword = (req, res) =>
{
    const resetLink = req.body.token;

    if(resetLink)
    {
        jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, async function(error, decodedData)
        {
            if(error)
            {
                return res.render('reset-password.ejs', { errorMessage: "This link expired. To resend a new email click 'Back to Login' then 'Forgot Password.'" });
            }

            userCollections.findOne({resetLink}).then(async (user, err) =>
            {
                if(err || !user)
                {
                    return res.render('reset-password.ejs', { errorMessage: "User with this token doesn't exist"});
                }

                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                const obj =
                {
                    password: hashedPassword,
                    resetLink: ''
                };

                user = _.extend(user, obj);

                user.save().then((result, err) =>
                {
                    if(err)
                    {
                        return res.render('reset-password.ejs', { errorMessage: "reset password error"});
                    }
                    else
                    {
                        return res.render('login.ejs', { successMessage: "Your password has been changed"});
                    }
                });
            });
        });
    }
}