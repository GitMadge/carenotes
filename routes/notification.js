//[SECTION] Dependencies and Modules
const express = require("express");
const notificationController = require("../controllers/notification");

const { verify, verifyDoctor, verifyPatient } = require("../auth");

//[SECTION] Routing Component
const router = express.Router();

//[SECTION] Clinic routes
router.post("/remind/:summaryId", verify, verifyDoctor, notificationController.sendReminder);

//[SECTION] Patient routes
router.get("/mine", verify, verifyPatient, notificationController.getMyNotifications);

router.patch("/:notificationId/read", verify, verifyPatient, notificationController.markAsRead);

module.exports = router;
