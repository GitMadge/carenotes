//[SECTION] Make a user a psychiatrist
// Sign-up always creates patients. Run this once for the clinic's psychiatrist after they sign in with Google:
//   npm run make-doctor -- someone@gmail.com
const mongoose = require("mongoose");

const User = require("./models/User");

require('dotenv').config();

const email = (process.argv[2] || "").toLowerCase();

if(!email.includes("@")) {
    console.log("Usage: npm run make-doctor -- someone@gmail.com");
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_STRING)
.then(() => User.findOneAndUpdate({ email }, { role: "doctor" }, { returnDocument: 'after' }))
.then(user => {
    if(user) {
        console.log(`${ user.firstName } ${ user.lastName } (${ user.email }) is now a psychiatrist. They need to log out and back in.`);
    } else {
        console.log(`No account found for ${ email }. Ask them to sign in once first, then run this again.`);
    }
    return mongoose.disconnect();
})
.catch(error => {
    console.error(error);
    return mongoose.disconnect();
});
