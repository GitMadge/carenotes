const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Medication Name is Required']
    },
    dosage: {
        type: String,
        default: ''
    },
    instructions: {
        type: String,
        default: ''
    },
    // Side effects the patient should watch for and report (e.g. "nausea, trouble sleeping")
    sideEffects: {
        type: String,
        default: ''
    }
}, { _id: false });

const summarySchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Patient ID is Required']
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Doctor ID is Required']
    },
    visitDate: {
        type: Date,
        default: Date.now
    },
    visitType: {
        type: String,
        enum: ['Initial evaluation', 'Medication management', 'Therapy session', 'Follow-up'],
        default: 'Follow-up'
    },
    diagnosis: {
        type: String,
        required: [true, 'Diagnosis is Required']
    },
    medications: [medicationSchema],
    nextSteps: {
        type: String,
        default: ''
    },
    // Patient-friendly version of the summary, written without medical jargon
    plainLanguage: {
        type: String,
        default: ''
    },
    // Psychiatrist-only notes. Never sent to the patient (see getMySummaries)
    privateNotes: {
        type: String,
        default: ''
    },
    // Date and time of the next appointment
    followUpDate: {
        type: Date
    },
    // Set when the clinic sends the same-day reminder, so it isn't sent twice
    reminderSentAt: {
        type: Date
    },
    // Lets the doctor see whether the patient has opened the summary
    readByPatient: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Summary', summarySchema);
