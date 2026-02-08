const router = require('express').Router();
const { sendRegistrationOTP, verifyAndRegister, resendRegistrationOTP } = require('../Controllers/register');

// Step 1: Send OTP to phone number
router.post('/send-otp', sendRegistrationOTP);

// Step 2: Verify OTP and complete registration
router.post('/verify', verifyAndRegister);

// Resend OTP if needed
router.post('/resend-otp', resendRegistrationOTP);

module.exports = router;