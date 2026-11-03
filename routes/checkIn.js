//[SECTION] Dependencies and Modules
const express = require("express");
const checkInController = require("../controllers/checkIn");

const { verify, verifyDoctor, verifyPatient } = require("../auth");

//[SECTION] Routing Component
const router = express.Router();

//[SECTION] Patient routes
router.post("/", verify, verifyPatient, checkInController.addCheckIn);

router.get("/mine", verify, verifyPatient, checkInController.getMyCheckIns);

//[SECTION] Psychiatrist routes
router.get("/patient/:patientId", verify, verifyDoctor, checkInController.getPatientCheckIns);

module.exports = router;
