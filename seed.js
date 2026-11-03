//[SECTION] Seed script
// Creates a demo psychiatrist, two demo patients, visit summaries and two weeks of mood check-ins.
// Run with: npm run seed  (clears existing users, summaries, check-ins and notifications first)
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Summary = require("./models/Summary");
const CheckIn = require("./models/CheckIn");
const Notification = require("./models/Notification");

require('dotenv').config();

// Demo-only credentials, safe to share in a portfolio README
const DEMO_PASSWORD = "Demo1234!";

const daysFromNow = (days, hour = 10, minute = 0) => {
    let date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, minute, 0, 0);
    return date;
};

mongoose.connect(process.env.MONGODB_STRING)
.then(() => Promise.all([
    User.deleteMany({}),
    Summary.deleteMany({}),
    CheckIn.deleteMany({}),
    Notification.deleteMany({})
]))
.then(() => User.insertMany([
    {
        firstName: "Elena",
        lastName: "Reyes",
        email: "doctor@demo.com",
        password: bcrypt.hashSync(DEMO_PASSWORD, 10),
        role: "doctor",
        mobileNo: "09170000001"
    },
    {
        firstName: "Marco",
        lastName: "Santos",
        email: "patient@demo.com",
        password: bcrypt.hashSync(DEMO_PASSWORD, 10),
        role: "patient",
        mobileNo: "09170000002",
        dateOfBirth: new Date("1985-04-12")
    },
    {
        firstName: "Liza",
        lastName: "Cruz",
        email: "liza@demo.com",
        password: bcrypt.hashSync(DEMO_PASSWORD, 10),
        role: "patient",
        mobileNo: "09170000003",
        dateOfBirth: new Date("1992-09-30")
    }
]))
.then(([doctor, marco, liza]) => Summary.insertMany([
    {
        patientId: marco._id,
        doctorId: doctor._id,
        visitDate: daysFromNow(-28),
        visitType: "Medication management",
        diagnosis: "Generalized anxiety disorder (F41.1)",
        medications: [
            {
                name: "Sertraline",
                dosage: "50 mg",
                instructions: "Once a day in the morning with food",
                sideEffects: "Upset stomach, headache or trouble sleeping in the first 2 weeks. Call the clinic if you feel more anxious or have thoughts of self-harm."
            }
        ],
        nextSteps: "Increase sertraline from 25 mg to 50 mg. Continue CBT weekly. Daily mood check-ins. Reassess GAD-7 at next visit.",
        plainLanguage: "Your medicine is working, so we're raising the dose a little to help more with worry and tension. Take one 50 mg Sertraline every morning with breakfast. Keep going to your weekly therapy sessions, and use the app each day to log how you're feeling. That helps us see how you're doing between visits.",
        privateNotes: "GAD-7 down from 15 to 11. Work stress main trigger. Some passive sleep complaints; monitor. No SI.",
        followUpDate: daysFromNow(0, 15, 30),
        readByPatient: true
    },
    {
        patientId: marco._id,
        doctorId: doctor._id,
        visitDate: daysFromNow(-70),
        visitType: "Initial evaluation",
        diagnosis: "Generalized anxiety disorder (F41.1)",
        medications: [
            {
                name: "Sertraline",
                dosage: "25 mg",
                instructions: "Once a day in the morning",
                sideEffects: "Mild nausea or headache at first. It usually goes away within a week or two."
            }
        ],
        nextSteps: "Start sertraline 25 mg. Referral to CBT. Sleep hygiene handout.",
        plainLanguage: "We talked about the constant worry and tension you've been feeling. This is called generalized anxiety, and it's very treatable. You'll start a low dose of a medicine called Sertraline and begin talk therapy. Medicine like this takes 4–6 weeks to work fully, so be patient with it.",
        privateNotes: "Family hx: mother with depression. Denies substance use. Safety screen negative.",
        readByPatient: true
    },
    {
        patientId: liza._id,
        doctorId: doctor._id,
        visitDate: daysFromNow(-10),
        visitType: "Initial evaluation",
        diagnosis: "Major depressive disorder, single episode, moderate (F32.1)",
        medications: [
            {
                name: "Escitalopram",
                dosage: "10 mg",
                instructions: "Once a day, same time each day",
                sideEffects: "Tiredness, nausea or lower sex drive. Don't stop suddenly. Talk to us first."
            }
        ],
        nextSteps: "Start escitalopram 10 mg. Safety plan reviewed. Follow-up in 4 weeks, sooner if worse.",
        plainLanguage: "You've been feeling low, tired and less interested in things for several months. This is depression, and it can get better with treatment. Take one Escitalopram each day. It can take a few weeks to notice a difference. If you ever feel unsafe, call the crisis line shown at the top of the app right away.",
        privateNotes: "PHQ-9: 16. Safety plan completed, sister is support contact. Passive SI denied today.",
        followUpDate: daysFromNow(18, 11, 0)
    }
]).then(() => [marco, liza]))
.then(([marco, liza]) => {

    // Two weeks of check-ins for Marco showing gradual improvement, and a few for Liza
    let marcoMoods = [4, 5, 4, 5, 5, 6, 5, 6, 6, 7, 6, 7, 7, 7];
    let marcoAnxiety = [8, 7, 8, 7, 7, 6, 6, 6, 5, 5, 5, 4, 4, 4];

    let checkIns = marcoMoods.map((mood, i) => ({
        patientId: marco._id,
        mood,
        anxiety: marcoAnxiety[i],
        sleepHours: [5, 6, 5, 6, 6, 7, 6, 7, 7, 7, 6, 7, 8, 7][i],
        tookMedication: i !== 4,
        note: i === 4 ? "Forgot my pill, busy morning." : i === 12 ? "Good week at work." : "",
        createdOn: daysFromNow(-14 + i, 20)
    }));

    [3, 4, 3, 4].forEach((mood, i) => checkIns.push({
        patientId: liza._id,
        mood,
        anxiety: 5,
        sleepHours: 9,
        tookMedication: true,
        note: i === 0 ? "Hard to get out of bed." : "",
        createdOn: daysFromNow(-7 + i * 2, 21)
    }));

    return CheckIn.insertMany(checkIns);
})
.then(() => {
    console.log("Seed complete. Log in with doctor@demo.com or patient@demo.com, password: " + DEMO_PASSWORD);
    return mongoose.disconnect();
})
.catch(error => {
    console.error(error);
    return mongoose.disconnect();
});
