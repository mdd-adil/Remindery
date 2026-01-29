const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description:{
        type: String,
        required: true
    },
    count:{
        type: Number,
        required: false,
        default: 3
    },
    daysBefore:{
        type: [Number],
        required: false,
        default: 3
    },
    endTime:{
        type: Date,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;