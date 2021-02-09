'use strict';

const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect("mongodb+srv://metadatapreprod:c9xkVcXkClOTAMzN@metadatapreprod-cn7ye.mongodb.net/EMG", { useNewUrlParser: true });

const nodemailer = require('nodemailer');

// User model
const User = require('./model/userDetails.js');
const PORT = 3011;

const app = express();

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(session({
  secret: 'secret token',
  resave: false,
  saveUninitialized: true,
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/assets', express.static(path.join(__dirname, "/assets")));


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

app.get("/", (req, res) => {
  res.render('home');
});

app.get('/dashboard', function (req, res) {
  if (!req.session.user) {
    res.redirect('login');
  } else {
    res.render('dashboard');
  }
});

app.get("/registration", (req, res) => {
  res.render('registration');
});

app.get("/login", (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  try {
    let user = await User.findOne({ username: req.body.email });
    if (user) {
      if (user.isVerified) {
        if (user.password == req.body.password) {
          req.session.user = {
            username: user.username,
          };
          return res.status(200).json({ success: "Sign in successful." });
        } else {
          return res.status(401).json({ error: "Password is incorrect." });
        }
      } else {
        return res.status(401).json({ error: "Email is not verified. Please verify." });
      }
    } else {
      return res.status(400).json({ error: "No user found." });
    }
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/registration", function (req, res) {
  const { email, password } = req.body;
  User.create({ username: email.toLocaleLowerCase(), password })
    .then(function (user) {
      mailOptions.to = user.username;
      const link = "http://localhost:3000/verifyEmail?emailId=" + user.username;
      mailOptions.html = 'Thanks for registration!! Please verify your email. <a href="' + link + '">Verify!!</a>'

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return res.status(401).json({ error: "Error sending verification email. Please contact to EMG." });
        } else {
          return res.status(200).json({ success: "We have sent a verification email to you. Please verify your email." });
        }
      });
    })
    .catch(function (err) {
      if (err.code == 11000) {
        return res.status(401).json({ error: "This email account is already registered." });
      } else {
        return res.status(401).json({ error: "Something went wrong." });
      }

    });
});

app.post("/updateForEntry", async (req, res) => {
  const { sendToEmail } = req.body;
  const sendEmailTo = sendToEmail.toLocaleLowerCase();
  const senderEmail = req.session.user.username;
  if (senderEmail == sendEmailTo) {
    return res.status(401).json({ error: "Nice try, please send gettings to your colleagues :)" });
  }

  try {
    let user = await User.findOne({ username: senderEmail });
    if (user.isVerified) {
      if (user.sendToEmailId.includes(sendEmailTo)) {
        return res.status(401).json({ error: "You have already sent greetings to this colleague." });
      } else {
        const filter = { username: senderEmail };
        const update = { sendToEmailId: sendToEmail };
        User.findOneAndUpdate(filter, {
          $push: {
            'sendToEmailId': sendToEmail
          }
        },
          { new: true }, (err, result) => {
            return res.status(200).json({ success: "Greetings sent successfully." });
          })
          .catch(function (err) {
            return res.status(401).json({ error: "Unable to send greetings." });
          });
      }
    } else {
      return res.status(401).json({ error: "Your email is not verified." });
    }
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong." });
  }
});

app.get("/verifyEmail", function (req, res) {
  console.log("VerifyEmail start");
  const filter = { username: req.query.emailId.toLocaleLowerCase() };
  const update = { isVerified: true };
  User.findOneAndUpdate(filter, update)
    .then((result) => {
      res.render("verificationsuccess");
    }).catch(function (err) {
      res.render("verificationfail");
    });
});

app.get("/signupsuccess", function (req, res) {
  res.render("signupsuccess");
});

// Start the server
app.listen(PORT, function () {
  console.log("Listening on port " + PORT + ".");
});