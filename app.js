const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');

require('dotenv').config();

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
}

const serviceAccount = require('./config/serviceAccountKey.json'); // Path to your service account JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'rsa-dashboard-34773',
});


const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ origin: '*' }));

app.post("/send-notification", async (req, res) => {
  const registrationToken = req.body.token;
  // console.log('the req token', req.body.token)
  const sound = req.body.sound;
  // console.log("req.body",req.body.sound)
  const message = {
    token: registrationToken,
    notification: {
      title: req.body.title,
      body: req.body.body,
    },
    android: {
      priority: "high", // Set high priority for Android notifications
      notification: {
        sound: sound, // Set the sound for Android
        channelId: "high_importance_channel", // Optional: Use a specific notification channel for high-priority sounds
      },
    },
    apns: {
      headers: {
        "apns-priority": "10", // Set high priority for iOS notifications
      },
      payload: {
        aps: {
          sound: sound, // Set the sound for iOS
          "content-available": 1, // Ensure high priority for background notifications
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).send("Notification sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).send("Notification failed");
  }
});



app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
