const { authenticate } = require('passport');
const bcrypt = require('bcrypt');

const LocalStrategy = require('passport-local').Strategy;


function initialize(passport, getUserByEmail, getUserById)
{
    const authenticateUser = async (email, password, done) =>
    {
        const User = await getUserByEmail(email);
        if (User == null)
        {
            return done(null, false, { message: 'No user with that email' });
        }

        try
        {
            if (await bcrypt.compare(password, User.password))
            {
                return done(null, User); // done function passes null for errors and the User instance
            }
            else
            {
                return done(null, false, { message: 'Password incorrect' });
            }
        }
        catch (e)
        {
            return done(e);
        }
    }
    // authenticate's requests
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser)); // says that the username field is the email
    // to maintain the user's session
    passport.serializeUser((User, done) => done(null, User.id));
    // attaches the user to the req.user object
    passport.deserializeUser((id, done) =>
    {
        return done(null, getUserById(id))
    });
}

module.exports = initialize