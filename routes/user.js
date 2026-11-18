//[SECTION] Dependencies and Modules
const express = require('express');
const userController = require('../controllers/user');

const { verify, verifyDoctor } = require("../auth");

//[SECTION] Routing Component
const router = express.Router();

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

//[SECTION] Google sign-in through Firebase
router.post("/google", userController.loginWithGoogle);

router.get("/firebase-config", userController.getFirebaseConfig);

router.get("/details", verify, userController.getProfile);

//[SECTION] Route for the doctor's patient list
router.get("/patients", verify, verifyDoctor, userController.getPatients);

module.exports = router;
