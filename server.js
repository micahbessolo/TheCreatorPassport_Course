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
let postsCollection = require('./models/post-collection-1-1');
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
        cohort: cohort
        isTestUser: isAdmin
    });
});

// for adding an admin
app.get('/add-admin-privileges', async (req, res) =>
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
        const Lesson = Number(URLData.split('-')[2]) - 1;

        // video Complete Marked
        if (currentTime === videoDuration)
        {
            user[sectionArray][Lesson] = `${currentTime}_${videoDuration}_${1}`;
            await userCollection.findOneAndUpdate({email: user.email}, user, {new: true});
        }
        else
        {
            let percentageComplete = Number(currentTime)/Number(videoDuration);
            percentageComplete = percentageComplete.toFixed(2);
            
            // only updates if the new progress is higher than the initial progress
            if (user[sectionArray][Lesson] === "" ||
                Number(user[sectionArray][Lesson].split('_')[2]) < percentageComplete)
            {
                user[sectionArray][Lesson] = `${currentTime}_${videoDuration}_${percentageComplete}`;
                await userCollection.findOneAndUpdate({email: user.email}, user, {new: true});
            }
        }
        return res.json({
            message: 'state updated'
        });
    }
    catch(err)
    {
        console.log("didn't work: " + err);
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
        for (let i = 1; i <= 16; i++)
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
        for (let i = 1; i <= 16; i++)
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