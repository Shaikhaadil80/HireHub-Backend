const express = require('express');
const User = require('../models/User');
const validator = require('validator');

const router = express.Router();

// @desc    Check if user exists by email
// @route   GET /api/public/check-email/:email
// @access  Public
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Validate email format
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        exists: false,
        error: 'Invalid email format'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if active user exists with this email
    const userExists = await User.exists({ 
      email: normalizedEmail,
      isActive: true 
    });

    // Simple boolean response
    res.status(200).json({
      success: true,
      exists: userExists,
      email: normalizedEmail
    });

  } catch (error) {
    console.error('Public email check error:', error);
    res.status(500).json({
      success: false,
      exists: false,
      error: 'Server error'
    });
  }
});

// @desc    Check if username is available
// @route   GET /api/public/check-username/:username
// @access  Public
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        available: false,
        error: 'Username must be at least 3 characters long'
      });
    }

    const usernameExists = await User.exists({ 
      userName: username,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      available: !usernameExists, // True if username is available
      username: username
    });

  } catch (error) {
    console.error('Public username check error:', error);
    res.status(500).json({
      success: false,
      available: false,
      error: 'Server error'
    });
  }
});

module.exports = router;