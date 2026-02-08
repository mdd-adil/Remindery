const router = require('express').Router();
const { 
    requestOTP, 
    verifyOTP, 
    resetPassword, 
    resendOTP 
} = require('../Controllers/forgotPassword');

// POST /forgot-password/request-otp - Request OTP for password reset
router.post('/request-otp', requestOTP);

// POST /forgot-password/verify-otp - Verify the OTP
router.post('/verify-otp', verifyOTP);

// POST /forgot-password/reset-password - Reset password after OTP verification
router.post('/reset-password', resetPassword);

// POST /forgot-password/resend-otp - Resend OTP if expired or not received
router.post('/resend-otp', resendOTP);

module.exports = router;
