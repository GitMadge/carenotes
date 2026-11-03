//[SECTION] Dependencies and Modules
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const userRoutes = require("./routes/user");
const summaryRoutes = require("./routes/summary");
const checkInRoutes = require("./routes/checkIn");
const notificationRoutes = require("./routes/notification");

//[SECTION] Environment Setup
require('dotenv').config();

//[SECTION] Server Setup
const app = express();

app.use(express.json());

const corsOptions = {
	origin: ['http://localhost:8000'],
	credentials: true,
	optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Serves the patient/doctor pages from the "public" folder
app.use(express.static(path.join(__dirname, "public")));


//[SECTION] Database Connection
mongoose.connect(process.env.MONGODB_STRING);

mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas'));


app.use("/users", userRoutes);
app.use("/summaries", summaryRoutes);
app.use("/checkins", checkInRoutes);
app.use("/notifications", notificationRoutes);

if(require.main === module) {
	app.listen(process.env.PORT || 4000, () => {
		console.log(`API is now online on port ${ process.env.PORT || 4000 }`);
	});
};

module.exports = { app, mongoose };
