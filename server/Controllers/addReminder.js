const express=require('express');
const router=express.Router();
const Reminder=require('../Models/reminderModel');

// Add Reminder
const reminder = async (req, res) => {
    try {
        const userId=req.params.id;
        const {  description, count, daysBefore, endTime } = req.body;

        // Create new reminder
        const newReminder = new Reminder({
            userId,
            description,
            count,
            daysBefore,
            endTime
        });

        // Save to database
        const savedReminder = await newReminder.save();

        res.status(201).json({ message: 'Reminder added successfully', reminder: savedReminder });
    } catch (error) {
        console.error('Error adding reminder:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = reminder;