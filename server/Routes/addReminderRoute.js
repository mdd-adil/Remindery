const express = require('express');
const router = express.Router();
const Reminder = require('../Controllers/addReminder');

// Add Reminder
router.post('/:id', Reminder)
module.exports = router;