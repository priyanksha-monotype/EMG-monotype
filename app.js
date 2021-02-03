let express = require('express');
let mongoose = require('mongoose');
// Require model
const User = require('./model/userDetails.js');

const nodemailer = require('nodemailer');

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
      pass: 'Maapapa@30'  //msipl paassword
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
    .then((res) => {
        console.log("Verification success");
        console.log(res);
    })
      .catch(function(err) {
        console.log("Verification failed");
      });
  });

  // Start the server
  app.listen(PORT, function() {
    console.log("Listening on port " + PORT + ".");
  });
