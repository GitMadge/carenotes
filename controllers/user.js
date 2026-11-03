//[SECTION] Dependencies and Modules
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../auth.js');
const { errorHandler } = require('../auth');


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
        if(result == null || !bcrypt.compareSync(req.body.password || "", result.password)) {
            return res.status(401).send({ message: "Incorrect email or password" });
        }

        return res.status(200).send({
            access : auth.createAccessToken(result),
            role : result.role
        });
    })
    .catch(error => errorHandler(error, req, res));
}


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
