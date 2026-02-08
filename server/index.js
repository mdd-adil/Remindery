const express = require('express');
const mongoose = require('mongoose');
const app = express();
const env=require('dotenv').config();
const connectDB = require('./database/mongoConnect');

// Load Routes
const registerRoute = require('./Routes/registerRoute');
const loginRoute = require('./Routes/loginRoute');
const reminderRoute = require('./Routes/addReminderRoute');
const forgotPasswordRoute = require('./Routes/forgotPasswordRoute');
const isLoggedIn = require('./middleware/isLoggedin');
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());


connectDB();

//  route
app.get('/api', (req, res) => {
    res.status(200).json({ message: 'Reminder App API is running' });
});
app.use('/register', registerRoute);
app.use('/login', loginRoute);
app.use('/forgot-password', forgotPasswordRoute);
app.use('/addReminder', isLoggedIn,require('./Routes/addReminderRoute'));

// Start server - Listen on all network interfaces for mobile device access
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    console.log(`For mobile devices, use your computer's local IP address`);
});