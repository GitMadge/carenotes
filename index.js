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

// Serves the patient/doctor pages from the "public" folder locally (on Vercel, public/ is served by its CDN instead)
app.use(express.static(path.join(__dirname, "public")));


//[SECTION] Database Connection
// On Vercel a server instance can outlive a failed first connection, so we try again on the next request
const connectDB = () => {
	if(mongoose.connection.readyState !== 0) {
		return Promise.resolve();
	}

	return mongoose.connect(process.env.MONGODB_STRING, { serverSelectionTimeoutMS: 8000 })
	.catch(err => {
		console.error("MongoDB connection error:", err.message);
		throw err;
	});
};

connectDB().catch(() => {});

mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas'));

app.use((req, res, next) => {
	connectDB()
	.then(() => next())
	.catch(() => res.status(503).send({ message: "Can't reach the database right now. Please try again in a minute." }));
});


app.use("/users", userRoutes);
app.use("/summaries", summaryRoutes);
app.use("/checkins", checkInRoutes);
app.use("/notifications", notificationRoutes);

if(require.main === module) {
	app.listen(process.env.PORT || 4000, () => {
		console.log(`API is now online on port ${ process.env.PORT || 4000 }`);
	});
};

// Vercel runs the exported app as a serverless function (app.listen above only runs locally)
module.exports = app;
