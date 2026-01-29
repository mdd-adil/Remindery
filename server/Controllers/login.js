const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../Models/userModel');
const cookieParser = require('cookie-parser');
const loginUser=async (req, res) => {
const { phoneNumber, password } = req.body;
try {
    if(!phoneNumber || !password) {
        
        return res.status(400).send({ message: 'Phone number and password are required' });
    }
    const user = await userModel.findOne({ phoneNumber });
    if (!user) {
        return res.status(401).send({ message: 'Invalid phone number or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).send({ message: 'Invalid phone number or password' });
    }
    const token = jwt.sign({ userId: user._id ,phoneNumber:user.phoneNumber}, process.env.SECRET, { expiresIn: '30d' });
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });
    res.send({ token });
} catch (error) {
    console.error('Login error:', error.message);
    res.status(500).send({ message: 'Server error' }); 
} 

}
module.exports =loginUser ;