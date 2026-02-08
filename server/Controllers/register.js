const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../Models/userModel');
const otpModel = require('../Models/otpModel');


const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


const sendRegistrationOTP = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        const existingUser = await userModel.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Phone number already registered'
            });
        }

        
        await otpModel.deleteMany({ phoneNumber, purpose: 'registration' });

        
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        const otpDoc = new otpModel({
            phoneNumber,
            otp,
            purpose: 'registration',
            expiresAt
        });
        await otpDoc.save();

      
        console.log(`Registration OTP for ${phoneNumber}: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your phone number',
            
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error('Send Registration OTP error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while sending OTP'
        });
    }
};


const verifyAndRegister = async (req, res) => {
    const { username, email, password, phoneNumber, otp } = req.body;

    try {
       
        if (!username || !password || !phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, phone number, and OTP are required'
            });
        }

        
        const existingUser = await userModel.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Phone number already registered'
            });
        }

        
        const existingUsername = await userModel.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: 'Username already taken'
            });
        }

       
        const otpRecord = await otpModel.findOne({
            phoneNumber,
            purpose: 'registration',
            isVerified: false
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found or already used. Please request a new OTP'
            });
        }

        
        if (new Date() > otpRecord.expiresAt) {
            await otpModel.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP'
            });
        }

        
        if (otpRecord.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

       
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
            username,
            email,
            password: hashedPassword,
            phoneNumber
        });
        await newUser.save();

       
        await otpModel.deleteOne({ _id: otpRecord._id });

        
        const token = jwt.sign(
            { userId: newUser._id, phoneNumber: newUser.phoneNumber },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                phoneNumber: newUser.phoneNumber,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Verify and Register error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

// Resend OTP for registration
const resendRegistrationOTP = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Check if phone number is already registered
        const existingUser = await userModel.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Phone number already registered'
            });
        }

        // Delete any existing OTP for this phone number
        await otpModel.deleteMany({ phoneNumber, purpose: 'registration' });

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Save OTP to database
        const otpDoc = new otpModel({
            phoneNumber,
            otp,
            purpose: 'registration',
            expiresAt
        });
        await otpDoc.save();

        // TODO: Send OTP via SMS service
        console.log(`Resent Registration OTP for ${phoneNumber}: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP resent successfully',
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error('Resend Registration OTP error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error while resending OTP'
        });
    }
};

module.exports = { sendRegistrationOTP, verifyAndRegister, resendRegistrationOTP };