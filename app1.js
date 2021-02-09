'use strict';

const express = require('express');
const session = require('express-session');
// const MongoDBStore = require('connect-mongodb-session')(session);
const cookieParser =require('cookie-parser');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect("mongodb+srv://metadatapreprod:c9xkVcXkClOTAMzN@metadatapreprod-cn7ye.mongodb.net/EMG", { useNewUrlParser: true });

const nodemailer = require('nodemailer');

// User model
const User = require('./model/userDetails.js');
const PORT = 3000;

const app = express();
app.use(session({
    secret: 'secret token',
    resave: false,
    saveUninitialized: true,
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
      user: 'emg@monotype.com', //msipl email
      pass: 'MonoUser123#'  //msipl paassword
    }
  });
  
const mailOptions = {
    from: 'emg@monotype.com',  //msipl email
    subject: 'Sending Email to test',
};

app.post('/login', async (req, res) => {
    try {
        let user = await User.findOne({username: req.body.username});
        if(user !== null) {
            req.session.user = {
                username: user.username,
            };
            res.sendStatus(200);
        } else {
            console.log('error');
           // Login error
        }
    } catch(err) {
        res.sendStatus(500);
    }
});

app.get('/dashboard', function(req, res){
    if(!req.session.user) {
        res.redirect('/login');
        return res.status(401).send();
    } else {
        return res.status(200).send("Welcome!");
    }
});

app.post("/registration", function(req, res) {
    console.log("Registration start", req.body);
    const { emailId, password} = req.body;
    User.create({ username: emailId.toLocaleLowerCase(), password})
      .then(function(user) {
        mailOptions.to = user.username;
        const link = "http://localhost:3000/verifyEmail?emailId=" + user.username;
        mailOptions.html = 'Thanks for registration!! Please verify your email. <a href="'+link+'">Verify!!</a>'

        console.log("Sending email!!");
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        res.json(user);
      })
      .catch(function(err) {
        console.log(err);
        // If an error occurred, send it to the client
        if(err.code == 11000) {
            res.json('This email is already registered. Please contact EMG for any fraud.')
        }
        res.json(err);
      });
  });

    // Start the server
  app.listen(PORT, function() {
    console.log("Listening on port " + PORT + ".");
  });