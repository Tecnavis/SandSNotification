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
const base64Key = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const serviceAccount = JSON.parse(Buffer.from(base64Key, 'base64').toString('utf8'));

// Initialize Firebase only once
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'rsa-dashboard-34773',  // Add projectId here directly
  });
}

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ origin: '*' }));

app.post("/send-notification", async (req, res) => {
  const registrationToken = req.body.token;
  const sound = req.body.sound;
  const message = {
    token: registrationToken,
    notification: {
      title: req.body.title,
      body: req.body.body,
    },
    android: {
      priority: "high",
      notification: {
        sound: sound,
        channelId: "high_importance_channel",
      },
    },
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload: {
        aps: {
          sound: sound,
          "content-available": 1,
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
