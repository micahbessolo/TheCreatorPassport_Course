const express = require('express');
const router = express.Router();
const videosCollection = require('../models/video-collections');
const userCollection = require('../models/user-collection');

router.get('/search-videos/:searchInput', checkAuthenticated, async (req, res) =>
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

router.get('/live-trainings', checkAuthenticated, async (req, res) => 
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

router.get('/live-trainings-object', checkAuthenticated, async (req, res) => {
    const results = await videosCollection.findOne({trackMod: "Live Trainings"}).then((info) =>
    {
        return info;
    });

    res.json(results);
});

router.get('/favorites', async (req, res) =>
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

// save video progress and percentage complete
router.patch('/video-state:videoState', async (req, res) =>
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

router.patch('/live-trainings-state:videoState', async (req, res) =>
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
router.patch('/favorites:liked', async (req, res) =>
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

router.get('/course', async (req, res) =>
{
    try 
    {
        const user = await userCollection.findOne({_id: req.user._conditions._id});
        if (!user) throw new Error('User not found');

        const data = { likedVideos: user.likedVideos };
        for (let i = 0; i <= 16; i++)
        {
            data[`_1_${i}`] = user[`_1_${i}`] || '';
        }
        for (let i = 0; i <= 11; i++)
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
router.get('/videoList/:lesson', async (req, res) => 
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

function checkAuthenticated(req, res, next)
{
    if (req.isAuthenticated()) // req.isAuthenticated() is a passport function that returns true if the user is authenticated
    {
        return next();
    }
    res.redirect('/login')
}

module.exports = router;