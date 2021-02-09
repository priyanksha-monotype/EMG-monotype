const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const nodemailer = require('nodemailer');

// User model
const User = require('./model/userDetails.js');
const PORT = 3000;

// Connect to MongoDB
mongoose.connect("mongodb+srv://metadatapreprod:c9xkVcXkClOTAMzN@metadatapreprod-cn7ye.mongodb.net/EMG", { useNewUrlParser: true });

let app = express();
// Parse request body as JSON
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/assets', express.static(path.join(__dirname, "/assets")));

app.use(passport.initialize());
app.use(passport.session());

app.use(require("express-session")({
  secret: "EMG",
  resave: false,
  saveUninitialized: false
}));

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(
  function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

function isLoggedIn(request, response, next) {
  if (request.isAuthenticated()) {
    return next();
  }
  response.redirect('/login');
}

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

// home route
app.get("/", function (req, res) {
  res.render("home");
});

// dahboard route
app.get("/dashboard", function (req, res) {
  res.render("dashboard");
}); 
  
// Route for creating a new User
app.get("/registration", (req, res) => {
  res.render("registration");
});

app.post("/registration", function (req, res) {
  console.log("Req", req.body);
  const { userEmail, userPassword } = req.body;
  let email = userEmail.toLocaleLowerCase();

  User.register(new User(
    { username: email, isVerified: false }), userPassword, function (err, user) {
      if (!err) {
        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          mailOptions.to = email;
          const link = "http://localhost:3000/verifyEmail?emailId=" + email;
          mailOptions.html = 'Thanks for registration!! Please verify your email. <a href="' + link + '">Verify!!</a>'
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              res.json('Unable to send verificaition email.')
            } else {
              res.json({ success: true, status: 'We have sent a verification email to you. You need to verify your email to proceed further.' });
            }
        });
        });
      } else {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({ err: 'This email is already registered. Please contact EMG if you haven\'t registered earlier.' });
      }
    });
});

// Route for verifying user email
app.get("/verifyEmail", function(req, res) {
    console.log("VerifyEmail start");
    const filter = { username: req.query.emailId.toLocaleLowerCase() };
    const update = { isVerified: true };
    User.findOneAndUpdate(filter, update)
    .then((result) => {
      res.render("verificationsuccess");
    }).catch(function(err) {
        res.render("verificationfail");
      });
});
  
// route for login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login'
}));


// Route for posting the data
app.post("/updateForEntry", function(req, res) {
  console.log("Adding rose entry");
  const { emailId, sendToEmail} = req.body;
  const filter = { userEmail: emailId.toLocaleLowerCase() };
  const update = { sendToEmailId: sendToEmail };
  //Check the user sending rose if he had already sent the email

  User.findOne({username: emailId.toLocaleLowerCase()}).then((user) => {
    //check if user account is verified
    if(user.isVerified)  {
      //check if user already sent roses to someone
      if(user.sendToEmailId) {
        res.json('You already send roses for someone!!');
      } else {
        //update sending user entry for rose
        User.findOneAndUpdate(filter, update)
        .then((resp) => {
          console.log("Updation sender success");
          res.json(resp);
        })
          .catch(function(err) {
            res.json(err);
            console.log("Updation sender failed", err);
          });
      }
    } else {
      throw Error('Email id needs to be verified.');
    }
  })
  .catch(function(err) {
    console.log("Invalid user id.", err);
    res.json('Email id either doesn`t exist or not verified.');
  });
});

  // Start the server
  app.listen(PORT, function() {
    console.log("Listening on port " + PORT + ".");
  });
