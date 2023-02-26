
const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const bcrypt = require('bcrypt'); // hashing with salting
const User = require('./models/user');
const saltRounds = 10;
const port = 3000;

const app = express();

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

app.set(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/register', async (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
        let user = new User({
            email: req.body.username,
            password: hash
        });
        try {
            user = await user.save();
            res.render('secrets');
        }
        catch(err){
            console.log( err.message );
        }
    });
});

app.post('/login', async (req, res) => {
    try {
        let user = await User.findOne({ email: req.body.username });
        if(user == null){
            throw new Error('User not found');
        }
        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if(result){
                res.render('secrets');
            }
        });
    }
    catch(err){
        console.log(err);
    }
});

app.listen(3000, () => console.log(`Server running on http://localhost:${port}`));