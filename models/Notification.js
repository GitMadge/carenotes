const mongoose = require('mongoose');

// In-app message to a patient (e.g. a same-day appointment reminder)
const notificationSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Patient ID is Required']
    },
    summaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Summary'
    },
    message: {
        type: String,
        required: [true, 'Message is Required']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
