const userCollections = require('../models/user-collection');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const mailgun = require("mailgun-js");
const DOMAIN = 'mg.thecreatorpassport.com';
const bcrypt = require('bcrypt');
const mg = mailgun({apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN});
const fs = require('fs');
const path = require('path');

// gets email template
const emailHtmlPath = path.join(__dirname, '../assets/email-templates/forgot-password.html');
const emailHtmlContent = fs.readFileSync(emailHtmlPath, 'utf8');


// sends forgot-password email with link including token
exports.forgotPassword = async (req, res) =>
{
    let userName;

    await userCollections.findOne({email: req.body.email}).then((user, err) =>
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
            to: req.body.email,
            subject: 'Password Reset',
            html: emailHtmlContent
            .replace('${userName}', userName)
            .replace(/\${token}/g, token)
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