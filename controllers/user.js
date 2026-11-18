//[SECTION] Dependencies and Modules
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../auth.js');
const { errorHandler } = require('../auth');
const { verifyFirebaseToken } = require('../firebaseAuth');


//[SECTION] User Registration
/*
    Steps:
    1. Check that the email is valid and not taken
    2. Hash the password and save the user as a patient
*/
module.exports.registerUser = (req, res) => {

    if(!req.body.email || !req.body.email.includes("@")) {
        return res.status(400).send({ message: "Invalid email" });
    }

    if(!req.body.password || req.body.password.length < 8) {
        return res.status(400).send({ message: "Password must be at least 8 characters" });
    }

    return User.findOne({ email: req.body.email.toLowerCase() })
    .then(existingUser => {

        if(existingUser) {
            return res.status(409).send({ message: "Email already registered" });
        }

        let newUser = new User({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            email : req.body.email,
            mobileNo : req.body.mobileNo,
            dateOfBirth : req.body.dateOfBirth,
            password : bcrypt.hashSync(req.body.password, 10)
        })

        return newUser.save()
        .then(() => res.status(201).send({ message: "Registered successfully" }));
    })
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] User Login
module.exports.loginUser = (req, res) => {

    if(!req.body.email || !req.body.email.includes("@")) {
        return res.status(400).send({ message: "Invalid email" });
    }

    return User.findOne({ email: req.body.email.toLowerCase() })
    .then(result => {

        // Same message for unknown email and wrong password so attackers can't tell which accounts exist
        // (Google-only accounts have no password, so they can't log in here)
        if(result == null || !result.password || !bcrypt.compareSync(req.body.password || "", result.password)) {
            return res.status(401).send({ message: "Incorrect email or password" });
        }

        return res.status(200).send({
            access : auth.createAccessToken(result),
            role : result.role
        });
    })
    .catch(error => errorHandler(error, req, res));
}


//[SECTION] Google Sign-in (Firebase)
/*
    Steps:
    1. Verify the Firebase ID token sent by the browser
    2. Find the user by Google ID or email, or create a new patient
    3. Send back our own access token so the rest of the app works the same as email/password login
*/
module.exports.loginWithGoogle = (req, res) => {

    return verifyFirebaseToken(req.body.idToken)
    .then(payload => {

        if(!payload.email || !payload.email_verified) {
            return res.status(401).send({ message: "Your Google email address is not verified" });
        }

        return User.findOne({ $or: [{ googleUid: payload.sub }, { email: payload.email.toLowerCase() }] })
        .then(existingUser => {

            if(existingUser) {
                // First Google sign-in for an existing email: link the Google account
                if(!existingUser.googleUid) {
                    existingUser.googleUid = payload.sub;
                    return existingUser.save();
                }
                return existingUser;
            }

            let names = (payload.name || payload.email.split("@")[0]).trim().split(" ");

            let newUser = new User({
                firstName : names[0],
                lastName : names.slice(1).join(" ") || "-",
                email : payload.email,
                authProvider : "google",
                googleUid : payload.sub
            });

            return newUser.save();
        })
        .then(user => res.status(200).send({
            access : auth.createAccessToken(user),
            role : user.role
        }));
    })
    .catch(error => {
        // Bad or expired tokens are the user's problem (401), anything else is a server error
        if(error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" || error.message.includes("Google sign-in")) {
            return res.status(401).send({ message: error.message });
        }
        errorHandler(error, req, res);
    });
};


//[SECTION] Public Firebase settings for the login page
// These values are meant to be public (they identify the Firebase project, they are not secrets)
module.exports.getFirebaseConfig = (req, res) => {

    if(!process.env.FIREBASE_API_KEY || !process.env.FIREBASE_PROJECT_ID) {
        return res.status(200).send({ enabled: false });
    }

    return res.status(200).send({
        enabled : true,
        apiKey : process.env.FIREBASE_API_KEY,
        authDomain : process.env.FIREBASE_AUTH_DOMAIN || `${ process.env.FIREBASE_PROJECT_ID }.firebaseapp.com`,
        projectId : process.env.FIREBASE_PROJECT_ID,
        appId : process.env.FIREBASE_APP_ID
    });
};


//[SECTION] Retrieve user details
module.exports.getProfile = (req, res) => {

    return User.findById(req.user.id).select("-password")
    .then(user => {
        if(!user) {
            return res.status(404).send({ message: "User not found" });
        }
        return res.status(200).send(user);
    })
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Retrieve all patients (doctor only)
module.exports.getPatients = (req, res) => {

    return User.find({ role: "patient" })
    .select("-password")
    .sort({ lastName: 1, firstName: 1 })
    .then(patients => res.status(200).send(patients))
    .catch(error => errorHandler(error, req, res));
};
