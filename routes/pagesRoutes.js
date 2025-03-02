const express = require('express');
const router = express.Router();
const userCollection = require('../models/user-collection');

router.get('/', checkAuthenticated, async (req, res) =>
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

router.get('/terms-and-conditions', (req, res) => 
{
    res.render('terms-and-conditions.ejs');
});

router.get('/privacy-policy', (req, res) => 
{
    res.render('privacy-policy.ejs');
});

router.get('/track1', async (req, res) =>
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

router.get('/track2', async (req, res) =>
{
    try
    {
        const user = await userCollection.findOne({_id: req.user._conditions._id});
        if (!user) throw new Error('User not found');

        const data = {};
        for (let i = 0; i <= 11; i++)
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

router.get('/track3', async (req, res) =>
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

function checkAuthenticated(req, res, next)
{
    if (req.isAuthenticated()) // req.isAuthenticated() is a passport function that returns true if the user is authenticated
    {
        return next();
    }
    res.redirect('/login')
}

module.exports = router;