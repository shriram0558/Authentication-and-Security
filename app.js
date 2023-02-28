
const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const port = 3000;
const User = require('./models/user');

const app = express();

app.set(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
    return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
    });
    });
});
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect('/secrets');
    }
);

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/secrets', async (req, res) => {
    const foundUsers = await User.find({"secret": {$ne: null}});
    // console.log(foundUsers);
    res.render('secrets', {usersWithSecrets: foundUsers});
});

app.get('/submit', (req, res) => {
    if(req.isAuthenticated()){
        res.render('submit');
    }
    else {
        res.redirect('/login');
    }
});

app.post('/submit', async (req, res) => {
    const submittedSecret = req.body.secret;

    const user = await User.findById(req.user.id);
    user.secret = submittedSecret;
    await user.save();
    res.redirect('/secrets');
});

app.get('/logout', (req, res) => {
    req.logout(function(err){});
    res.redirect('/');
});

app.post('/register', async (req, res) => {
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if(err){
            console.log(err);
            res.redirect('/register');
        }
        else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/secrets');
            });
        }
    });
});

app.post('/login', async (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/secrets');
            });
        }
    });
});

app.listen(3000, () => console.log(`Server running on http://localhost:${port}`));