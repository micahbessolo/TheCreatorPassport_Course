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

// mongodb connection and models
const connectMongoDB = require("./mongodb");
const userCollection = require('./models/user-collection');
const initializePassport = require('./passport-config');

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

// Functions
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const communityRoutes = require('./routes/communityRoutes');
const videosRoutes = require('./routes/videosRoutes');
const pageRoutes = require('./routes/pagesRoutes');

// routes
app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', communityRoutes);
app.use('/', videosRoutes);
app.use('/', pageRoutes);

app.listen(PORT, () => 
{
    console.log(`Server started on http://localhost:${PORT}`);
    connectMongoDB();
});