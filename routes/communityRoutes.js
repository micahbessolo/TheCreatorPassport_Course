const express = require('express');
const router = express.Router();
const userCollection = require('../models/user-collection');
const postsCollection = require('../models/post-collection-1');
const notificationsCollection = require('../models/notification-collection');
const multer  = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
    filename: function (req, file, cb)
    {
        cb(null, file.originalname)
    }
});
const upload = multer({storage: storage});

router.get('/community-page', checkAuthenticated, async (req, res) =>
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

router.get('/get-all-posts', checkAuthenticated, async (req, res) =>
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

router.get('/get-posts', checkAuthenticated, async (req, res) =>
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

router.get('/get-post/:id', checkAuthenticated, async (req, res) =>
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

router.get('/get-pdf-files', async (req, res) =>
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


router.post('/create-post', checkAuthenticated, upload.single('image-post'), async (req, res) =>
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

router.patch('/edit-post', checkAuthenticated, upload.single('image-post'), async (req, res) => 
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
router.post("/comment/:id", checkAuthenticated, async (req, res) => 
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
router.patch("/edit-comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
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
router.delete("/delete-comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
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
router.patch("/edit-comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
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
router.delete("/delete-comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
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
router.post("/comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
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
router.patch("/edit-reply/:postId/:commentId/:replyId", checkAuthenticated, async (req, res) =>
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
router.delete("/delete-reply/:postId/:commentId/:replyId", checkAuthenticated, async (req, res) =>
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
router.post("/like/:id", checkAuthenticated,  async (req, res) =>
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
router.post("/like-comment/:postId/:commentId", checkAuthenticated, async (req, res) =>
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

router.post("/like-reply/:postId/:commentId/:replyId", checkAuthenticated, async (req, res) =>
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

router.get("/name/:id", async (req, res) =>
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
router.delete("/:id", checkAuthenticated, async (req, res) =>
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

// Pin post
router.get("/pin/:id", checkAuthenticated, async (req, res) =>
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
router.get("/guide/:id", checkAuthenticated, async (req, res) =>
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
router.get("/guides", checkAuthenticated, async (req, res) =>
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
router.get("/user-array/:username", checkAuthenticated, async (req, res) =>
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
router.get("/posts-by-date-range/:dateRange", checkAuthenticated, async (req, res) => 
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
router.get("/posts-by-search/:searchInput", checkAuthenticated, async (req, res) => 
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
router.get("/pin/:id", checkAuthenticated, async (req, res) =>
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
router.get("/guide/:id", checkAuthenticated, async (req, res) =>
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

// get post from guides
router.get("/guides", checkAuthenticated, async (req, res) =>
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

// Get user posts
router.get("/user/:username", checkAuthenticated, async (req, res) =>
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
router.get("/likes/:id", checkAuthenticated, async (req, res) =>
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