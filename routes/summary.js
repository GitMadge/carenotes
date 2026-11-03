//[SECTION] Dependencies and Modules
const express = require("express");
const summaryController = require("../controllers/summary");

const { verify, verifyDoctor, verifyPatient } = require("../auth");

//[SECTION] Routing Component
const router = express.Router();

//[SECTION] Doctor routes
router.post("/", verify, verifyDoctor, summaryController.addSummary);

router.get("/patient/:patientId", verify, verifyDoctor, summaryController.getPatientSummaries);

router.get("/follow-ups", verify, verifyDoctor, summaryController.getUpcomingFollowUps);

router.patch("/:summaryId", verify, verifyDoctor, summaryController.updateSummary);

router.delete("/:summaryId", verify, verifyDoctor, summaryController.deleteSummary);

//[SECTION] Patient routes
router.get("/mine", verify, verifyPatient, summaryController.getMySummaries);

router.patch("/:summaryId/read", verify, verifyPatient, summaryController.markAsRead);

module.exports = router;
