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
const PORT = process.env.PORT || 6000;
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');



// mongodb connection and models
const connectMongoDB = require("./mongodb");
const userCollections = require('./models/user-collection');
const videoCollections = require('./models/video-collections');
const postCollections = require('./models/post-collection');
const Notification = require('./models/notification-collection');

const initializePassport = require('./passport-config');
const {forgotPassword, resetPassword} = require("./password_recovery/auth");

initializePassport(passport, 
    email => userCollections.findOne({email: email}),
    id => userCollections.findOne({_id: id})
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

app.get('/login', checkNotAuthenticated, (req, res) => 
{
    res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', 
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
        console.log("success")
        return res.redirect('/');
    }
    next();
}

app.get('/', checkAuthenticated, async (req, res) =>
{
    let userEmail;
    let userName;
    let profileImg;

    console.log(userCollections)
    console.log(req);

    const results = await userCollections.findOne({_id: req.user._conditions._id}).then((info, err) =>
    {
        userEmail = info.email;
        userName = info.name;
        profileImg = info.profileImg;
        liveTrainingsProgress = info.liveTrainingsProgress;
    });

    res.render('library.ejs', {
        userName: userName,
        email: userEmail,
        profileImg: profileImg,
        liveTrainingsProgress: liveTrainingsProgress
    });
});

app.get('/live-trainings-object', checkAuthenticated, async (req, res) => {
    const results = await videoCollections.findOne({trackMod: "Live Trainings"}).then((info, err) =>
    {
        return info;
    });

    res.json(results);
});

app.get('/favorites', async (req, res) =>
{
    let likedVideos;

    try
    {
        const results = await userCollections.findOne({_id: req.user._conditions._id}).then((info, err) =>
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

// save video progress and percentage complete
app.patch('/video-state:videoState', async (req, res) =>
{
    let email; 
    let _1_1;let _1_2;let _1_3;let _1_4;let _1_5;let _1_6;let _1_7;let _1_8;let _1_9;let _1_10;
    let _1_11;let _1_12;let _1_13;let _1_14;let _1_15;let _1_16;let _2_1;let _2_2;let _2_3;
    let _2_4;let _2_5;let _2_6;let _2_7;let _2_8;let _2_9;let _2_10;let _2_11;let _3_1;let _3_2;
    let _3_3;let _3_4;let _3_5;let _3_6;let _3_7;let _3_8;let _3_9;let _3_10;
    
    try
    {
        const results = await userCollections.findOne({_id: req.user._conditions._id}).then((info, err) =>
        {
            email = info.email;
            _1_1 = info._1_1;_1_2 = info._1_2;_1_3 = info._1_3;_1_4 = info._1_4;
            _1_5 = info._1_5;_1_6 = info._1_6;_1_7 = info._1_7;_1_8 = info._1_8;
            _1_9 = info._1_9;_1_10 = info._1_10;_1_11 = info._1_11;_1_12 = info._1_12;
            _1_13 = info._1_13;_1_14 = info._1_14;_1_15 = info._1_15;_1_16 = info._1_16;
            _2_1 = info._2_1;_2_2 = info._2_2;_2_3 = info._2_3;_2_4 = info._2_4;
            _2_5 = info._2_5;_2_6 = info._2_6;_2_7 = info._2_7;_2_8 = info._2_8;
            _2_9 = info._2_9;_2_10 = info._2_10;_2_11 = info._2_11;_3_1 = info._3_1;
            _3_2 = info._3_2;_3_3 = info._3_3;_3_4 = info._3_4;_3_5 = info._3_5;
            _3_6 = info._3_6;_3_7 = info._3_7;_3_8 = info._3_8;_3_9 = info._3_9;
            _3_10 = info._3_10;
        });

        const currentTime = JSON.parse(JSON.stringify(req.body)).currentTime;
        const videoDuration = JSON.parse(JSON.stringify(req.body)).videoDuration;
        const URLData = JSON.parse(JSON.stringify(req.body)).URLData;
        const sectionArray = `_${URLData.split('-')[0]}_${URLData.split('-')[1]}`;
        const Lesson = Number(URLData.split('-')[2]) - 1;
        let percentageComplete = Number(currentTime)/Number(videoDuration);
        percentageComplete = percentageComplete.toFixed(2);
        // defines one of the lessons (i.e. _1_1 as a new value including currentTime_vidDuration_percentageComplete)
        eval(`_${URLData.split('-')[0]}_${URLData.split('-')[1]}[${Lesson}] = "${currentTime}_${videoDuration}_${percentageComplete}";`);

        let data = 
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
        };
        const newState = await userCollections.findOneAndUpdate({email: email}, data, {new: true});
    }
    catch(err)
    {
        console.log("didn't work: " + err);
    }

    return res.json({
        message: 'state updated'
    });
});

app.patch('/live-trainings-state:videoState', async (req, res) =>
{
    let email;
    let liveTrainingsProgress
    const results = await userCollections.findOne({_id: req.user._conditions._id}).then((info, err) => 
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

    // Update the specific training progress
    liveTrainingsProgress[Training] = `${currentTime}_${videoDuration}_${percentageComplete}`;

    let data = {
        liveTrainingsProgress: liveTrainingsProgress
    };

    const newState = await userCollections.findOneAndUpdate({email: email}, data, {new: true});
    res.send(newState);
});

// save favorites
app.patch('/favorites:liked', async (req, res) =>
{
    let likedVideos;
    let email; 
    
    try
    {
        const results = await userCollections.findOne({_id: req.user._conditions._id}).then((info, err) =>
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
                const newState = await userCollections.findOneAndUpdate({email: email}, { $addToSet: {likedVideos: likedVid}});
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
    
                const newState = await userCollections.findOneAndUpdate({email: email}, data, {new: true});
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
    let userEmail;
    let likedVideos;
    let _1_1;let _1_2;let _1_3;let _1_4;let _1_5;let _1_6;let _1_7;let _1_8;let _1_9;let _1_10;
    let _1_11;let _1_12;let _1_13;let _1_14;let _1_15;let _1_16;let _2_1;let _2_2;let _2_3;
    let _2_4;let _2_5;let _2_6;let _2_7;let _2_8;let _2_9;let _2_10;let _2_11;let _3_1;let _3_2;
    let _3_3;let _3_4;let _3_5;let _3_6;let _3_7;let _3_8;let _3_9;let _3_10;
    try
    {
        const results = await userCollections.findOne({_id: req.user._conditions._id}).then((user, err) =>
        {
            userEmail = user.email;
            likedVideos = user.likedVideos,
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
        });

        res.render('course.ejs', 
        {
            likedVideos: likedVideos,
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
    }
    catch(e)
    {
        res.render('login.ejs')
    }
});

// gets list of video titles with their links
app.post('/videoList', async (req, res) => 
{
    let request = Object.keys(JSON.parse(JSON.stringify(req.body)))[0];

    const videoList = await videoCollections.findOne({trackMod: request}).then((data, err) =>
    {
        return data;
    });

    res.json(videoList);
});

app.get('/track1', async (req, res) =>
{
    let _1_1;let _1_2;let _1_3;let _1_4;let _1_5;let _1_6;let _1_7;let _1_8;let _1_9;let _1_10;
    let _1_11;let _1_12;let _1_13;let _1_14;let _1_15;let _1_16;

    try
    {
        const result = await userCollections.findOne({_id: req.user._conditions._id}).then((user, err) =>
        {
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
        });

        res.render('track1.ejs', 
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
        });
    }
    catch
    {
        res.render('login.ejs')
    }
});

app.get('/track2', async (req, res) =>
{
    let _2_1;let _2_2;let _2_3;let _2_4;let _2_5;let _2_6;let _2_7;let _2_8;let _2_9;let _2_10;let _2_11;

    try
    {
        const result = await userCollections.findOne({_id: req.user._conditions._id}).then((user, err) =>
        {
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
        });

        res.render('track2.ejs', 
        {
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
            _2_11: _2_11
        });
    }
    catch
    {
        res.render('login.ejs')
    }
});

app.get('/track3', async (req, res) =>
{
    let _3_1;let _3_2;let _3_3;let _3_4;let _3_5;let _3_6;let _3_7;let _3_8;let _3_9;let _3_10;

    try
    {
        const userName = await userCollections.findOne({_id: req.user._conditions._id}).then((user, err) =>
        {
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
        });
    
        res.render('track3.ejs', 
        {
            _3_1: _3_1,
            _3_2: _3_2,
            _3_3: _3_3,
            _3_4: _3_4,
            _3_5: _3_5,
            _3_6: _3_6,
            _3_7: _3_7,
            _3_8: _3_8,
            _3_9: _3_9,
            _3_10: _3_10,
        });
    }
    catch
    {
        res.render('login.ejs')
    }
    
});

app.listen(PORT, () => 
{
    console.log(`Server started on http://localhost:${PORT}`);
    connectMongoDB();
});