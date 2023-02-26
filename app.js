
const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');

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
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/secrets', (req, res) => {
    if(req.isAuthenticated()){
        res.render('secrets');
    }
    else {
        res.redirect('/login');
    }
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