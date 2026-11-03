const Notification = require("../models/Notification");
const Summary = require("../models/Summary");

const { errorHandler } = require('../auth');

// Shown in every appointment reminder (also on the patient page's next-appointment card)
const PRE_VISIT_NOTE = "Before your appointment: please check that your insurance on file is correct. If you happen to be in between insurances, cash pay starts at $90.";

const isToday = (date) => {
    let today = new Date();
    return date.getFullYear() === today.getFullYear()
        && date.getMonth() === today.getMonth()
        && date.getDate() === today.getDate();
};

//[SECTION] Send a same-day appointment reminder (clinic only)
/*
    Steps:
    1. Find the summary and make sure its follow-up is today
    2. Stop if a reminder was already sent
    3. Create an in-app notification for the patient and save when it was sent
*/
module.exports.sendReminder = (req, res) => {

    return Summary.findById(req.params.summaryId)
    .populate("doctorId", "lastName")
    .then(summary => {

        if(!summary) {
            return res.status(404).send({ message: "Summary not found" });
        }

        if(!summary.followUpDate || !isToday(summary.followUpDate)) {
            return res.status(400).send({ message: "Reminders can only be sent on the day of the appointment" });
        }

        if(summary.reminderSentAt) {
            return res.status(409).send({ message: "A reminder was already sent for this appointment" });
        }

        let time = summary.followUpDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        let doctor = summary.doctorId ? `Dr. ${ summary.doctorId.lastName }` : "your psychiatrist";

        let newNotification = new Notification({
            patientId : summary.patientId,
            summaryId : summary._id,
            message : `Reminder: you have an appointment today at ${ time } with ${ doctor }. Contact the clinic if you need to reschedule.\n\n${ PRE_VISIT_NOTE }`
        });

        // SMS/email could be sent here too (e.g. Twilio or SendGrid) using the patient's mobileNo/email
        return newNotification.save()
        .then(() => {
            summary.reminderSentAt = new Date();
            return summary.save();
        })
        .then(saved => res.status(201).send({ reminderSentAt: saved.reminderSentAt }));
    })
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Retrieve the logged-in patient's notifications
module.exports.getMyNotifications = (req, res) => {

    return Notification.find({ patientId: req.user.id })
    .sort({ createdOn: -1 })
    .limit(20)
    .then(notifications => res.status(200).send(notifications))
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Dismiss a notification (patient only, and only their own)
module.exports.markAsRead = (req, res) => {

    return Notification.findOneAndUpdate(
        { _id: req.params.notificationId, patientId: req.user.id },
        { isRead: true },
        { returnDocument: 'after' }
    )
    .then(notification => {
        if(notification) {
            res.status(200).send(true);
        } else {
            res.status(404).send({ message: "Notification not found" });
        }
    })
    .catch(error => errorHandler(error, req, res));
};
