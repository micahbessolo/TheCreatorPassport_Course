const express = require('express');
const router = express.Router();
const { topNav, topNavNotifications, markNotificationRead } = require('../topnav');
const userCollection = require('../models/user-collection');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer  = require('multer');
const mailgun = require("mailgun-js");
const DOMAIN = 'mg.thecreatorpassport.com';
const mg = mailgun({apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN});

const storage = multer.diskStorage({
    filename: function (req, file, cb)
    {
        cb(null, file.originalname)
    }
});
const upload = multer({storage: storage});

// gets email template
const emailHtmlPath = path.join(__dirname, '../assets/email-templates/first-time-user.html');
const emailHtmlContent = fs.readFileSync(emailHtmlPath, 'utf8');

router.get('/admin-page', checkAuthenticated, async (req, res) =>
{
    res.render('admin.ejs');
});

// for adding an admin
router.get('/add-admin-privileges', checkAuthenticated, async (req, res) =>
{
    try
    {
        await userCollection.updateMany({}, { $set: { admin: false } });

        const adminEmails = [
            'mbessolo@westmont.edu',
            'ryanleebanksmedia@gmail.com',
            'dani@theloverspassport.com',
            'dreamwithlo@gmail.com',
            'maggie@theloverspassport.com',
            'thecreatorpassport@gmail.com'
        ];
        await userCollection.updateMany({ email: { $in: adminEmails } }, { $set: { admin: true } });

        res.send('Admin privileges updated successfully');
    } 
    catch (err) 
    {
        res.status(500).send('Error updating admin privileges: ' + err);
    }
});

router.get('/find-user-by-email/:email', checkAuthenticated, async (req, res) =>
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

router.delete('/delete-user-by-email/:email', checkAuthenticated, async (req, res) =>
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

router.get('/update-email/:oldEmail/:newEmail', checkAuthenticated, async (req, res) =>
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

router.post('/add-user/:firstName/:lastName/:email', checkAuthenticated, async (req, res) =>
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

router.get('/send-first-time-email/:email', checkAuthenticated, async (req, res) => 
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
                html: emailHtmlContent
                    .replace('${userName}', userName)
                    .replace(/\${token}/g, token)
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

router.get('/topNav/:page', checkAuthenticated, async (req, res) => 
{
    res.send(await topNav(req));
});

router.get('/topNavNotifications/:type', checkAuthenticated, async (req, res) =>
{
    res.send(await topNavNotifications(req));
});

router.post('/mark-notification-read', checkAuthenticated, async (req, res) =>
{
    res.send(await markNotificationRead(req));
});

router.post('/update-user', checkAuthenticated, upload.single('profileImg'), async (req, res) =>
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

router.get('/count-cohort-3', async (req, res) =>
    {
    try
    {
        const count = await userCollection.countDocuments({ cohort: 3 });
        res.status(200).json({ count });
    }
    catch (error)
    {
        console.log("Error in counting documents: ", error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get("/getProgress", async (req, res) =>
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
router.get("/getLessonProgress", async (res) =>
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

    flattenedArray.forEach(item =>
        {
        const { lesson, progress } = item;
        if (!lessonMap.has(lesson))
        {
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

module.exports = router;