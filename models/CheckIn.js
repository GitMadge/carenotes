const mongoose = require('mongoose');

// A patient's between-visit mood check-in
const checkInSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Patient ID is Required']
    },
    // 1 = very low, 10 = very good
    mood: {
        type: Number,
        required: [true, 'Mood is Required'],
        min: 1,
        max: 10
    },
    // 1 = calm, 10 = very anxious
    anxiety: {
        type: Number,
        required: [true, 'Anxiety is Required'],
        min: 1,
        max: 10
    },
    sleepHours: {
        type: Number,
        min: 0,
        max: 24
    },
    tookMedication: {
        type: Boolean,
        default: true
    },
    note: {
        type: String,
        default: '',
        maxlength: 1000
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CheckIn', checkInSchema);
