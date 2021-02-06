let express = require('express');
let mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// User model
const User = require('./model/userDetails.js');
const PORT = 3000;

// Connect to MongoDB
mongoose.connect("mongodb+srv://metadatapreprod:c9xkVcXkClOTAMzN@metadatapreprod-cn7ye.mongodb.net/EMG", { useNewUrlParser: true });

let app = express();
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
      user: 'priyanksha.srivastava@monotype.com', //msipl email
      pass: ''  //msipl paassword
    }
  });
  
const mailOptions = {
    from: 'priyanksha.srivastava@monotype.com',  //msipl email
    subject: 'Sending Email to test',
};
  
// Route for creating a new User
app.post("/registration", function(req, res) {
    console.log("Registration start", req.body);
    const { emailId, password} = req.body;
    User.create({ userEmail: emailId.toLocaleLowerCase(), userPassword: password})
      .then(function(user) {
        mailOptions.to = user.userEmail;
        const link = "http://localhost:3000/verifyEmail?emailId=" + user.userEmail;
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
        // If an error occurred, send it to the client
        if(err.code == 11000) {
            res.json('This email is already registered. Please contact EMG for any fraud.')
        }
        res.json(err);
      });
  });

// Route for verifying user email
app.get("/verifyEmail", function(req, res) {
    console.log("VerifyEmail start");
    const filter = { userEmail: req.query.emailId.toLocaleLowerCase() };
    const update = { isVerified: true };
    User.findOneAndUpdate(filter, update)
    .then((result) => {
        res.json("Verification success");
        console.log(result);

    })
      .catch(function(err) {
        console.log("Verification failed");
        res.json(err);
      });
  });

// Route for posting the data
app.post("/updateForEntry", function(req, res) {
  console.log("Adding rose entry");
  const { emailId, sendToEmail} = req.body;
  const filter = { userEmail: emailId.toLocaleLowerCase() };
  const update = { sendToEmailId: sendToEmail };
  //Check the user sending rose if he had already sent the email

  User.findOne({userEmail: emailId.toLocaleLowerCase()}).then((user) => {
    //check if user account is verified
    if(user.isVerified)  {
      //check if user already sent roses to someone
      if(user.sendToEmailId) {
        res.json('You already send roses for someone!!');
      } else {
        //update sending user entry for rose
        User.findOneAndUpdate(filter, update)
        .then((resp) => {
          const filter = { userEmail: sendToEmail.toLocaleLowerCase() };
          const update = { receivedFromEmailId: emailId };
          // create or update receiver's entry 
          User.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true })
            .then(() => {
              console.log("Updation receiver success");
            }).catch((e) => { 
              console.log(e, 'Updation receiver failed');
            });
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

// Route for login the user
app.post("/login", function(req, res) {
  console.log("Login start");
  const { emailId, password} = req.body;
  User.findOne({userEmail: emailId.toLocaleLowerCase(), userPassword: password})
  .then((response) => {
    if(response.isVerified)  {
      console.log("Login success");
      console.log(res);
      res.json(response);
    } else {
      res.json('Email id needs to be verified.');
    }
  })
    .catch(function(err) {
      console.log("Useremail or password not valid.");
      res.json("Useremail or password not valid.", err);
    });
});

  // Start the server
  app.listen(PORT, function() {
    console.log("Listening on port " + PORT + ".");
  });
