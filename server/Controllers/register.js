const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../Models/userModel');

const registerUser = async (req, res) => {
    const { username, email, password,phoneNumber} = req.body;
    try {
        if (!username  || !password||!phoneNumber) {
            return res.status(400).send({ message: 'Username, password, and phone number are required' });
        }
        const existingUser = await userModel.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(409).send({ message: 'Phone number already in use' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
            username,
            email,
            password: hashedPassword,
            phoneNumber
        });
        await newUser.save();
        res.status(201).send({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
};

module.exports = { registerUser };