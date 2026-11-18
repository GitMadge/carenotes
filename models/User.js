const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First Name is Required']
    },
    lastName: {
        type: String,
        required: [true, 'Last Name is Required']
    },
    email: {
        type: String,
        required: [true, 'Email is Required'],
        lowercase: true,
        trim: true
    },
    // "local" = email/password, "google" = Firebase Google sign-in
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    // Firebase user ID, set the first time someone signs in with Google
    googleUid: {
        type: String
    },
    // Google accounts have no password in our database
    password: {
        type: String,
        required: [function() { return this.authProvider === 'local'; }, 'Password is Required']
    },
    // Public registration always creates patients; doctor accounts come from the seed script
    role: {
        type: String,
        enum: ['patient', 'doctor'],
        default: 'patient'
    },
    mobileNo: {
        type: String,
        required: [function() { return this.authProvider === 'local'; }, 'Mobile Number is Required']
    },
    dateOfBirth: {
        type: Date
    }
});

module.exports = mongoose.model('User', userSchema);
