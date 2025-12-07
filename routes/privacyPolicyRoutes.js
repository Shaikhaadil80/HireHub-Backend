// routes/privacyPolicyRoutes.js
const express = require('express');
const router = express.Router();
const { getPrivacyPolicy } = require('../controllers/privacyPolicyController');

// GET /api/privacy-policy - Get privacy policy HTML
router.get('/', getPrivacyPolicy);

module.exports = router;