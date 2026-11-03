const CheckIn = require("../models/CheckIn");

const { errorHandler } = require('../auth');

//[SECTION] Add a mood check-in (patient only)
/*
    Steps:
    1. Save the check-in with the logged-in patient as the owner
    2. Send back a flag if the mood is low so the page can show crisis resources
*/
module.exports.addCheckIn = (req, res) => {

    let newCheckIn = new CheckIn({
        patientId : req.user.id,
        mood : req.body.mood,
        anxiety : req.body.anxiety,
        sleepHours : req.body.sleepHours,
        tookMedication : req.body.tookMedication,
        note : req.body.note
    });

    return newCheckIn.save()
    .then(result => res.status(201).send({ checkIn: result, lowMood: result.mood <= 3 }))
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Retrieve the logged-in patient's check-ins (last 30 days)
module.exports.getMyCheckIns = (req, res) => {

    return CheckIn.find({ patientId: req.user.id, createdOn: { $gte: daysAgo(30) } })
    .sort({ createdOn: 1 })
    .then(checkIns => res.status(200).send(checkIns))
    .catch(error => errorHandler(error, req, res));
};


//[SECTION] Retrieve one patient's check-ins (psychiatrist only, last 30 days)
module.exports.getPatientCheckIns = (req, res) => {

    return CheckIn.find({ patientId: req.params.patientId, createdOn: { $gte: daysAgo(30) } })
    .sort({ createdOn: 1 })
    .then(checkIns => res.status(200).send(checkIns))
    .catch(error => errorHandler(error, req, res));
};


const daysAgo = (days) => {
    let date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};
