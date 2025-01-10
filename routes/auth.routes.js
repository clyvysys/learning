// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Register admin (for initial setup)
router.post('/register', authController.registerAdmin);

// Login admin
router.post('/login', authController.login);

module.exports = router;
