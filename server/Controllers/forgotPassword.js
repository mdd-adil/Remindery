const bcrypt = require('bcrypt');
const userModel = require('../Models/userModel');
const otpModel = require('../Models/otpModel');

// Generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP for forgot password
const requestOTP = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        // Validate input
        if (!phoneNumber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number is required' 
            });
        }

        // Check if user exists
        const user = await userModel.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User with this phone number does not exist' 
            });
        }

        // Delete any existing OTP for this phone number
        await otpModel.deleteMany({ phoneNumber, purpose: 'forgot_password' });

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Save OTP to database
        const otpDoc = new otpModel({
            phoneNumber,
            otp,
            purpose: 'forgot_password',
            expiresAt
        });
        await otpDoc.save();

        // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
        // For development, log the OTP
        console.log(`OTP for ${phoneNumber}: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your phone number',
            // Remove otp from response in production
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error('Request OTP error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while sending OTP' 
        });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    try {
        // Validate input
        if (!phoneNumber || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number and OTP are required' 
            });
        }

        // Find OTP record
        const otpRecord = await otpModel.findOne({ 
            phoneNumber, 
            purpose: 'forgot_password',
            isVerified: false 
        });

        if (!otpRecord) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP not found or already used. Please request a new OTP' 
            });
        }

        // Check if OTP is expired
        if (new Date() > otpRecord.expiresAt) {
            await otpModel.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new OTP' 
            });
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP' 
            });
        }

        // Mark OTP as verified
        otpRecord.isVerified = true;
        await otpRecord.save();

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully. You can now reset your password'
        });

    } catch (error) {
        console.error('Verify OTP error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while verifying OTP' 
        });
    }
};

// Reset password after OTP verification
const resetPassword = async (req, res) => {
    const { phoneNumber, newPassword, confirmPassword } = req.body;

    try {
        // Validate input
        if (!phoneNumber || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number, new password, and confirm password are required' 
            });
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Passwords do not match' 
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Check if OTP was verified
        const otpRecord = await otpModel.findOne({ 
            phoneNumber, 
            purpose: 'forgot_password',
            isVerified: true 
        });

        if (!otpRecord) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please verify OTP first before resetting password' 
            });
        }

        // Find user
        const user = await userModel.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password
        user.password = hashedPassword;
        await user.save();

        // Delete used OTP record
        await otpModel.deleteMany({ phoneNumber, purpose: 'forgot_password' });

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password'
        });

    } catch (error) {
        console.error('Reset password error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while resetting password' 
        });
    }
};

// Resend OTP
const resendOTP = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        // Validate input
        if (!phoneNumber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number is required' 
            });
        }

        // Check if user exists
        const user = await userModel.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User with this phone number does not exist' 
            });
        }

        // Check for existing OTP and rate limiting (prevent spam)
        const existingOTP = await otpModel.findOne({ 
            phoneNumber, 
            purpose: 'forgot_password' 
        });

        if (existingOTP) {
            const timeSinceCreation = Date.now() - existingOTP.createdAt.getTime();
            const minWaitTime = 60 * 1000; // 1 minute

            if (timeSinceCreation < minWaitTime) {
                const remainingTime = Math.ceil((minWaitTime - timeSinceCreation) / 1000);
                return res.status(429).json({ 
                    success: false, 
                    message: `Please wait ${remainingTime} seconds before requesting a new OTP` 
                });
            }
        }

        // Delete any existing OTP
        await otpModel.deleteMany({ phoneNumber, purpose: 'forgot_password' });

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Save new OTP
        const otpDoc = new otpModel({
            phoneNumber,
            otp,
            purpose: 'forgot_password',
            expiresAt
        });
        await otpDoc.save();

        // TODO: Send OTP via SMS service
        console.log(`Resent OTP for ${phoneNumber}: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP resent successfully',
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error('Resend OTP error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while resending OTP' 
        });
    }
};

module.exports = {
    requestOTP,
    verifyOTP,
    resetPassword,
    resendOTP
};
