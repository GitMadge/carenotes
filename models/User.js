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
    password: {
        type: String,
        required: [true, 'Password is Required']
    },
    // Public registration always creates patients; doctor accounts come from the seed script
    role: {
        type: String,
        enum: ['patient', 'doctor'],
        default: 'patient'
    },
    mobileNo: {
        type: String,
        required: [true, 'Mobile Number is Required']
    },
    dateOfBirth: {
        type: Date
    }
});

module.exports = mongoose.model('User', userSchema);
