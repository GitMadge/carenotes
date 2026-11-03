# CareNotes: psychiatric follow-up care

A simple follow-up care app for a psychiatric clinic. The psychiatrist writes visit notes and sends same-day appointment reminders. Patients read plain-language summaries of their care, see their medications and what side effects to watch for, and log daily mood check-ins between visits.

## Features

**Psychiatrist / clinic side**
- **Today's appointments** with a one-click **Send reminder** button. The patient gets an in-app reminder with the appointment time and the pre-visit insurance note. Each appointment can only be reminded once, and only on the day itself.
- Searchable patient list and an "Upcoming" appointments panel
- Visit notes: visit type, diagnosis, medications (dosage, instructions, side effects to watch for), treatment plan, plain-language explanation, and next appointment date/time
- 🔒 **Private notes** (screening scores, safety assessment). Never sent to the patient: the API strips them out.
- Mood and anxiety trend chart from the patient's check-ins, with weekly flags for low-mood days and missed doses
- See whether the patient has read each note

**Patient side**
- Crisis line banner on every page (988 / 911)
- Appointment reminders from the clinic
- Next-appointment card with a "Before your visit" checklist:
  > Please check that your insurance on file is correct. If you happen to be in between insurances, cash pay starts at $90.
- Daily check-in: mood (1–10), anxiety (1–10), sleep hours, medication taken, optional note. A low mood score shows crisis resources right away.
- 30-day mood chart, with a table view
- Visit notes shown in plain language first, with a switch to the clinical notes

**Security**
- Passwords hashed with bcrypt, JWT auth with 8-hour expiry
- Role checks on every route (`verifyDoctor` / `verifyPatient`)
- Patients can only read their own notes, check-ins and notifications
- Public sign-up always creates a patient. Psychiatrist accounts come from the seed script.

## Tech stack

Node.js, Express 5, MongoDB/Mongoose, JWT, plus a vanilla HTML/CSS/JS frontend that Express serves.

## Run it

1. `npm install`
2. Create `.env`:
   ```
   PORT=4000
   MONGODB_STRING=<your MongoDB connection string>
   JWT_SECRET_KEY=<any long random string>
   ```
3. `npm run seed` to load demo data (this **clears** all users, notes, check-ins and notifications). The seed always puts one appointment on today's date, so you can try the reminder button.
4. `npm start`, then open http://localhost:4000

Demo logins (password `Demo1234!`): psychiatrist `doctor@demo.com`; patients `patient@demo.com`, `liza@demo.com`

## API

| Method | Route | Who |
|---|---|---|
| POST | `/users/register` | anyone (creates a patient) |
| POST | `/users/login` | anyone |
| GET | `/users/details` | logged in |
| GET | `/users/patients` | psychiatrist |
| POST | `/summaries` | psychiatrist |
| GET | `/summaries/patient/:patientId` | psychiatrist |
| GET | `/summaries/follow-ups` | psychiatrist |
| PATCH | `/summaries/:summaryId` | psychiatrist |
| DELETE | `/summaries/:summaryId` | psychiatrist |
| GET | `/summaries/mine` | patient (private notes removed) |
| PATCH | `/summaries/:summaryId/read` | patient |
| POST | `/checkins` | patient |
| GET | `/checkins/mine` | patient |
| GET | `/checkins/patient/:patientId` | psychiatrist |
| POST | `/notifications/remind/:summaryId` | psychiatrist (same day only) |
| GET | `/notifications/mine` | patient |
| PATCH | `/notifications/:notificationId/read` | patient |

## Next steps for a real clinic

- **SMS/email reminders:** `controllers/notification.js` marks where a Twilio/SendGrid call would go, using the patient's `mobileNo`/`email`.
- **Front-desk role:** a `staff` role that can send reminders without seeing clinical notes.
- **Compliance:** HIPAA-grade hosting, audit logs, a signed BAA with every vendor, and doctor-patient assignment.
- Mood check-ins are not monitored in real time. The app says so to patients and points them to 988.
