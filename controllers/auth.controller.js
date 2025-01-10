// controllers/auth.controller.js

const Admin = require('../models/admin.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/config');  // <-- reference the config

exports.registerAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = new Admin({
      username,
      password: hashedPassword
    });
    await admin.save();

    return res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ adminId: admin._id }, SECRET_KEY, { expiresIn: '1d' });

    return res.json({ message: 'Login successful', token });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
