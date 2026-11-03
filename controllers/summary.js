const Summary = require("../models/Summary");
const User = require("../models/User");

const { errorHandler } = require('../auth');

// Only these fields can be set from the request body; patientId/doctorId/readByPatient are controlled by the server
const pickSummaryFields = (body) => {
    return {
        visitDate : body.visitDate,
        visitType : body.visitType,
        diagnosis : body.diagnosis,
        medications : body.medications,
        nextSteps : body.nextSteps,
        plainLanguage : body.plainLanguage,
        privateNotes : body.privateNotes,
        followUpDate : body.followUpDate || null
    };
};

//[SECTION] Create a visit summary
/*
    Steps:
    1. Make sure the patientId belongs to an actual patient
    2. Save the summary with the logged-in doctor as the author
*/
module.exports.addSummary = (req, res) => {

    return User.findOne({ _id: req.body.patientId, role: "patient" })
    .then(patient => {

        if(!patient) {
            return res.status(404).send({ message: "Patient not found" });
        }

        let newSummary = new Summary({
            ...pickSummaryFields(req.body),
            patientId : patient._id,
            doctorId : req.user.id
        });

        return newSummary.save()
        .then(result => res.status(201).send(result));
    })
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Retrieve one patient's summaries (doctor only)
module.exports.getPatientSummaries = (req, res) => {

    return Summary.find({ patientId: req.params.patientId })
    .populate("doctorId", "firstName lastName")
    .sort({ visitDate: -1 })
    .then(summaries => res.status(200).send(summaries))
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Retrieve upcoming follow-ups (doctor only)
module.exports.getUpcomingFollowUps = (req, res) => {

    let startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return Summary.find({ followUpDate: { $gte: startOfToday } })
    .populate("patientId", "firstName lastName mobileNo")
    .sort({ followUpDate: 1 })
    .then(summaries => res.status(200).send(summaries))
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Update a summary (doctor only)
module.exports.updateSummary = (req, res) => {

    // Editing a summary marks it unread again so the patient sees the change
    let updatedSummary = { ...pickSummaryFields(req.body), readByPatient: false };

    return Summary.findById(req.params.summaryId)
    .then(existing => {
        if(!existing) {
            return null;
        }

        // A new appointment time needs a new reminder
        let oldTime = existing.followUpDate ? existing.followUpDate.getTime() : null;
        let newTime = updatedSummary.followUpDate ? new Date(updatedSummary.followUpDate).getTime() : null;
        if(oldTime !== newTime) {
            updatedSummary.reminderSentAt = null;
        }

        return Summary.findByIdAndUpdate(req.params.summaryId, updatedSummary, { returnDocument: 'after', runValidators: true });
    })
    .then(summary => {
        if(summary) {
            res.status(200).send(summary);
        } else {
            res.status(404).send({ message: "Summary not found" });
        }
    })
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Delete a summary (doctor only)
module.exports.deleteSummary = (req, res) => {

    return Summary.findByIdAndDelete(req.params.summaryId)
    .then(summary => {
        if(summary) {
            res.status(200).send({ message: "Summary deleted" });
        } else {
            res.status(404).send({ message: "Summary not found" });
        }
    })
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Retrieve the logged-in patient's own summaries
module.exports.getMySummaries = (req, res) => {

    // privateNotes are excluded so they never reach the patient's browser
    return Summary.find({ patientId: req.user.id })
    .select("-privateNotes")
    .populate("doctorId", "firstName lastName")
    .sort({ visitDate: -1 })
    .then(summaries => res.status(200).send(summaries))
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Mark a summary as read (patient only, and only their own)
module.exports.markAsRead = (req, res) => {

    return Summary.findOneAndUpdate(
        { _id: req.params.summaryId, patientId: req.user.id },
        { readByPatient: true },
        { returnDocument: 'after' }
    )
    .then(summary => {
        if(summary) {
            res.status(200).send(true);
        } else {
            res.status(404).send({ message: "Summary not found" });
        }
    })
    .catch(error => errorHandler(error, req, res));
};
