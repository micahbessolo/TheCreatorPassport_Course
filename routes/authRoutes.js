const express = require('express');
const passport = require('passport');
const { forgotPassword, resetPassword } = require("../password_recovery/auth");

const router = express.Router();

router.get('/login', checkNotAuthenticated, (req, res) =>
{
    res.render('login.ejs');
});

router.post('/login', checkNotAuthenticated, passport.authenticate('local',
{
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

router.delete('/logout', (req, res) =>
{
    req.logout(req.user, err =>
    {
        if (err) return next(err);
        res.redirect("/login");
    });
});

router.get('/forgot-password', (req, res) =>
{
    res.render('forgot-password.ejs');
});

router.post('/forgot-password', forgotPassword);

router.get('/reset-password', (req, res) =>
{
    res.render('reset-password.ejs');
});

function checkNotAuthenticated(req, res, next)
{
    if (req.isAuthenticated())
    {
        return res.redirect('/');
    }
    next();
}

router.post('/reset-password', resetPassword);

module.exports = router;