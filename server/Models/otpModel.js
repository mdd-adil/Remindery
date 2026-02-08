const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['forgot_password', 'verification', 'registration'],
        default: 'forgot_password'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Auto-delete when expired
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
otpSchema.index({ phoneNumber: 1, purpose: 1 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
