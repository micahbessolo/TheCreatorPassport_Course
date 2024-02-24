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
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const {loginCollection} = require("./mongodb");
const initializePassport = require('./passport-config');
const {forgotPassword, resetPassword} = require("./password_recovery/auth");
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

initializePassport(passport, 
    email => loginCollection.findOne({email: email}),
    id => loginCollection.findOne({_id: id})
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

let _1_1;let _1_2;let _1_3;let _1_4;let _1_5;let _1_6;let _1_7;let _1_8;let _1_9;let _1_10;
let _1_11;let _1_12;let _1_13;let _1_14;let _1_15;let _1_16;let _2_1;let _2_2;let _2_3;
let _2_4;let _2_5;let _2_6;let _2_7;let _2_8;let _2_9;let _2_10;let _2_11;let _3_1;let _3_2;
let _3_3;let _3_4;let _3_5;let _3_6;let _3_7;let _3_8;let _3_9;let _3_10;

app.get('/', checkAuthenticated, async (req, res) =>
{
    let videoTime;
    const userName = await loginCollection.findOne({_id: req.user._conditions._id}).then((user, err) =>
    {
        userEmail = user.email;
        _1_1 = user._1_1;
        _1_2 = user._1_2;
        _1_3 = user._1_3;
        _1_4 = user._1_4;
        _1_5 = user._1_5;
        _1_6 = user._1_6;
        _1_7 = user._1_7;
        _1_8 = user._1_8;
        _1_9 = user._1_9;
        _1_10 = user._1_10;
        _1_11 = user._1_11;
        _1_12 = user._1_12;
        _1_13 = user._1_13;
        _1_14 = user._1_14;
        _1_15 = user._1_15;
        _1_16 = user._1_16;
        _2_1 = user._2_1;
        _2_2 = user._2_2;
        _2_3 = user._2_3;
        _2_4 = user._2_4;
        _2_5 = user._2_5;
        _2_6 = user._2_6;
        _2_7 = user._2_7;
        _2_8 = user._2_8;
        _2_9 = user._2_9;
        _2_10 = user._2_10;
        _2_11 = user._2_11;
        _3_1 = user._3_1;
        _3_2 = user._3_2;
        _3_3 = user._3_3;
        _3_4 = user._3_4;
        _3_5 = user._3_5;
        _3_6 = user._3_6;
        _3_7 = user._3_7;
        _3_8 = user._3_8;
        _3_9 = user._3_9;
        _3_10 = user._3_10;
        return user.name;
    });

    res.render('library.ejs', { 
        name: userName, 
        _1_1: _1_1,
        _1_2: _1_2,
        _1_3: _1_3,
        _1_4: _1_4,
        _1_5: _1_5,
        _1_6: _1_6,
        _1_7: _1_7,
        _1_8: _1_8,
        _1_9: _1_9,
        _1_10: _1_10,
        _1_11: _1_11,
        _1_12: _1_12,
        _1_13: _1_13,
        _1_14: _1_14,
        _1_15: _1_15,
        _1_16: _1_16,
        _2_1: _2_1,
        _2_2: _2_2,
        _2_3: _2_3,
        _2_4: _2_4,
        _2_5: _2_5,
        _2_6: _2_6,
        _2_7: _2_7,
        _2_8: _2_8,
        _2_9: _2_9,
        _2_10: _2_10,
        _2_11: _2_11,
        _3_1: _3_1,
        _3_2: _3_2,
        _3_3: _3_3,
        _3_4: _3_4,
        _3_5: _3_5,
        _3_6: _3_6,
        _3_7: _3_7,
        _3_8: _3_8,
        _3_9: _3_9,
        _3_10: _3_10
    });
});

app.get('/login', checkNotAuthenticated, (req, res) => 
{
    res.render('login.ejs');
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

app.post('/login', checkNotAuthenticated, passport.authenticate('local', 
{
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => 
{
    res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, (req, res) =>
{
    loginCollection.findOne({email: req.body.email}).then(async (user, err) => 
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
                    password: hashedPassword
                }
            await loginCollection.insertMany([data]);
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
    let password;
    let email; 
    let userName;
    let createdDate;
    
    const results = await loginCollection.find({email: userEmail}).then((info, err) =>
    {
        password = info[0].password;
        email = info[0].email;
        userName = info[0].name;
        createdDate = info[0].createdDate;
        _1_1 = info[0]._1_1;_1_2 = info[0]._1_2;_1_3 = info[0]._1_3;_1_4 = info[0]._1_4;
        _1_5 = info[0]._1_5;_1_6 = info[0]._1_6;_1_7 = info[0]._1_7;_1_8 = info[0]._1_8;
        _1_9 = info[0]._1_9;_1_10 = info[0]._1_10;_1_11 = info[0]._1_11;_1_12 = info[0]._1_12;
        _1_13 = info[0]._1_13;_1_14 = info[0]._1_14;_1_15 = info[0]._1_15;_1_16 = info[0]._1_16;
        _2_1 = info[0]._2_1;_2_2 = info[0]._2_2;_2_3 = info[0]._2_3;_2_4 = info[0]._2_4;
        _2_5 = info[0]._2_5;_2_6 = info[0]._2_6;_2_7 = info[0]._2_7;_2_8 = info[0]._2_8;
        _2_9 = info[0]._2_9;_2_10 = info[0]._2_10;_2_11 = info[0]._2_11;_3_1 = info[0]._3_1;
        _3_2 = info[0]._3_2;_3_3 = info[0]._3_3;_3_4 = info[0]._3_4;_3_5 = info[0]._3_5;
        _3_6 = info[0]._3_6;_3_7 = info[0]._3_7;_3_8 = info[0]._3_8;_3_9 = info[0]._3_9;
        _3_10 = info[0]._3_10;
    });

    const currentTime = JSON.parse(JSON.stringify(req.body)).currentTime;
    const videoDuration = JSON.parse(JSON.stringify(req.body)).videoDuration;
    const URLData = JSON.parse(JSON.stringify(req.body)).URLData;
    const sectionArray = `_${URLData.split('-')[0]}_${URLData.split('-')[1]}`;
    const Lesson = Number(URLData.split('-')[2]) - 1;
    let percentageComplete = Number(currentTime)/Number(videoDuration);
    percentageComplete = percentageComplete.toFixed(2);


    eval(`_${URLData.split('-')[0]}_${URLData.split('-')[1]}[${Lesson}] = "${currentTime}_${videoDuration}_${percentageComplete}";`);

    try
    {
        let data = 
        {
            password: password,
            email: email,
            name: userName,
            createdDate: createdDate,
            _1_1: _1_1,
            _1_2: _1_2,
            _1_3: _1_3,
            _1_4: _1_4,
            _1_5: _1_5,
            _1_6: _1_6,
            _1_7: _1_7,
            _1_8: _1_8,
            _1_9: _1_9,
            _1_10: _1_10,
            _1_11: _1_11,
            _1_12: _1_12,
            _1_13: _1_13,
            _1_14: _1_14,
            _1_15: _1_15,
            _1_16: _1_16,
            _2_1: _2_1,
            _2_2: _2_2,
            _2_3: _2_3,
            _2_4: _2_4,
            _2_5: _2_5,
            _2_6: _2_6,
            _2_7: _2_7,
            _2_8: _2_8,
            _2_9: _2_9,
            _2_10: _2_10,
            _2_11: _2_11,
            _3_1: _3_1,
            _3_2: _3_2,
            _3_3: _3_3,
            _3_4: _3_4,
            _3_5: _3_5,
            _3_6: _3_6,
            _3_7: _3_7,
            _3_8: _3_8,
            _3_9: _3_9,
            _3_10: _3_10
        };

        const newState = await loginCollection.findOneAndUpdate({email: email}, data, {new: true});
    }
    catch(err)
    {
        console.log("didn't work: " + err);
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

app.get('/success', (req, res) => 
{
    res.render('success.ejs');
});

app.get('/cancel', (req, res) => 
{
    res.render('cancel.ejs');
});

const storeItems = new Map([
    [1, { priceInCents: 300000, name: "course" }]
]);

app.get('/create-checkout-session', (req, res) => 
{
    res.render('checkout.ejs');
})

app.post('/create-checkout-session', async (req, res) => 
{
    try 
    {
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
    }
    catch (e)
    {
        res.status(500).json({ error: e.message });
    }
});

app.get('/course', async (req, res) => 
{

    const userName = await loginCollection.findOne({_id: req.user._conditions._id}).then((user, err) =>
    {
        userEmail = user.email;
        _1_1 = user._1_1;
        _1_2 = user._1_2;
        _1_3 = user._1_3;
        _1_4 = user._1_4;
        _1_5 = user._1_5;
        _1_6 = user._1_6;
        _1_7 = user._1_7;
        _1_8 = user._1_8;
        _1_9 = user._1_9;
        _1_10 = user._1_10;
        _1_11 = user._1_11;
        _1_12 = user._1_12;
        _1_13 = user._1_13;
        _1_14 = user._1_14;
        _1_15 = user._1_15;
        _1_16 = user._1_16;
        _2_1 = user._2_1;
        _2_2 = user._2_2;
        _2_3 = user._2_3;
        _2_4 = user._2_4;
        _2_5 = user._2_5;
        _2_6 = user._2_6;
        _2_7 = user._2_7;
        _2_8 = user._2_8;
        _2_9 = user._2_9;
        _2_10 = user._2_10;
        _2_11 = user._2_11;
        _3_1 = user._3_1;
        _3_2 = user._3_2;
        _3_3 = user._3_3;
        _3_4 = user._3_4;
        _3_5 = user._3_5;
        _3_6 = user._3_6;
        _3_7 = user._3_7;
        _3_8 = user._3_8;
        _3_9 = user._3_9;
        _3_10 = user._3_10;
        return user.name;
    });

    res.render('course.ejs', 
    {
        _1_1: _1_1,
        _1_2: _1_2,
        _1_3: _1_3,
        _1_4: _1_4,
        _1_5: _1_5,
        _1_6: _1_6,
        _1_7: _1_7,
        _1_8: _1_8,
        _1_9: _1_9,
        _1_10: _1_10,
        _1_11: _1_11,
        _1_12: _1_12,
        _1_13: _1_13,
        _1_14: _1_14,
        _1_15: _1_15,
        _1_16: _1_16,
        _2_1: _2_1,
        _2_2: _2_2,
        _2_3: _2_3,
        _2_4: _2_4,
        _2_5: _2_5,
        _2_6: _2_6,
        _2_7: _2_7,
        _2_8: _2_8,
        _2_9: _2_9,
        _2_10: _2_10,
        _2_11: _2_11,
        _3_1: _3_1,
        _3_2: _3_2,
        _3_3: _3_3,
        _3_4: _3_4,
        _3_5: _3_5,
        _3_6: _3_6,
        _3_7: _3_7,
        _3_8: _3_8,
        _3_9: _3_9,
        _3_10: _3_10
    });
});

// gets list of video titles with their links
app.post('/videoList', async (req, res) => 
{
    let request = Object.keys(JSON.parse(JSON.stringify(req.body)))[0];

    const videoList = await loginCollection.findOne({trackMod: request}).then((data, err) =>
    {
        return data;
    });
    res.json(videoList);
});

app.get('/track', async (req, res) =>
{
    let videoTime;

    const userName = await loginCollection.findOne({_id: req.user._conditions._id}).then((user, err) =>
    {
        userEmail = user.email;
        _1_1 = user._1_1;
        _1_2 = user._1_2;
        _1_3 = user._1_3;
        _1_4 = user._1_4;
        _1_5 = user._1_5;
        _1_6 = user._1_6;
        _1_7 = user._1_7;
        _1_8 = user._1_8;
        _1_9 = user._1_9;
        _1_10 = user._1_10;
        _1_11 = user._1_11;
        _1_12 = user._1_12;
        _1_13 = user._1_13;
        _1_14 = user._1_14;
        _1_15 = user._1_15;
        _1_16 = user._1_16;
        _2_1 = user._2_1;
        _2_2 = user._2_2;
        _2_3 = user._2_3;
        _2_4 = user._2_4;
        _2_5 = user._2_5;
        _2_6 = user._2_6;
        _2_7 = user._2_7;
        _2_8 = user._2_8;
        _2_9 = user._2_9;
        _2_10 = user._2_10;
        _2_11 = user._2_11;
        _3_1 = user._3_1;
        _3_2 = user._3_2;
        _3_3 = user._3_3;
        _3_4 = user._3_4;
        _3_5 = user._3_5;
        _3_6 = user._3_6;
        _3_7 = user._3_7;
        _3_8 = user._3_8;
        _3_9 = user._3_9;
        _3_10 = user._3_10;
        return user.name;
    });

    res.render('track.ejs', 
    {
        _1_1: _1_1,
        _1_2: _1_2,
        _1_3: _1_3,
        _1_4: _1_4,
        _1_5: _1_5,
        _1_6: _1_6,
        _1_7: _1_7,
        _1_8: _1_8,
        _1_9: _1_9,
        _1_10: _1_10,
        _1_11: _1_11,
        _1_12: _1_12,
        _1_13: _1_13,
        _1_14: _1_14,
        _1_15: _1_15,
        _1_16: _1_16,
        _2_1: _2_1,
        _2_2: _2_2,
        _2_3: _2_3,
        _2_4: _2_4,
        _2_5: _2_5,
        _2_6: _2_6,
        _2_7: _2_7,
        _2_8: _2_8,
        _2_9: _2_9,
        _2_10: _2_10,
        _2_11: _2_11,
        _3_1: _3_1,
        _3_2: _3_2,
        _3_3: _3_3,
        _3_4: _3_4,
        _3_5: _3_5,
        _3_6: _3_6,
        _3_7: _3_7,
        _3_8: _3_8,
        _3_9: _3_9,
        _3_10: _3_10
    });
});

app.listen(3000);