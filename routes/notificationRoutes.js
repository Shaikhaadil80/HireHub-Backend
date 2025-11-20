const express = require('express');
const {
  updateFCMToken,
  getNotifications,
  markNotificationAsRead,
  updateNotificationPreferences
} = require('../controllers/notificationUserController');
const { verifyFirebaseToken, requireUserInDB } = require('../middleware/firebaseAuth');

const router = express.Router();

// Firebase protected routes
router.use(verifyFirebaseToken);
router.use(requireUserInDB);

// Notification routes
router.put('/fcm-token', updateFCMToken);
router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);
router.put('/preferences', updateNotificationPreferences);

module.exports = router;