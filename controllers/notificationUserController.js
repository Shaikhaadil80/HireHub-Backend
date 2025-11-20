const User = require('../models/User');
const Notification = require('../models/Notification');

const NotificationUserController = {
  // Update user's FCM token
  async updateFCMToken(req, res) {
    try {
      const { fcmToken } = req.body;
      const userId = req.user.uid;

      // if (!fcmToken) {
      //   return res.status(400).json({
      //     success: false,
      //     error: 'FCM token is required'
      //   });
      // }

      await User.findOneAndUpdate(
        { uid: userId },
        { fcmToken: fcmToken },
        { upsert: true, new: true }
      );

      res.status(200).json({
        success: true,
        message: 'FCM token updated successfully'
      });
    } catch (error) {
      console.error('Update FCM token error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error while updating FCM token'
      });
    }
  },

  // Get user's notifications
  async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const userId = req.user.uid;

      let query = { userId };
      if (unreadOnly === 'true') {
        query.read = false;
      }

      const notifications = await Notification.find(query)
        .sort({ sentAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Notification.countDocuments(query);

      res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error while fetching notifications'
      });
    }
  },

  // Mark notification as read
  async markNotificationAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.uid;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error while updating notification'
      });
    }
  },

  // Update notification preferences
  async updateNotificationPreferences(req, res) {
    try {
      const { preferences } = req.body;
      const userId = req.user.uid;

      await User.findOneAndUpdate(
        { uid: userId },
        { notificationPreferences: preferences },
        { upsert: true, new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      console.error('Update notification preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error while updating preferences'
      });
    }
  }
};

module.exports = NotificationUserController;