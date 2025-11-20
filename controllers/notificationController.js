const {admin} = require('../middleware/firebaseAuth');
const User = require('../models/User'); // Assuming you have a User model

const NotificationController = {
  // Send push notification to specific user
  async sendPushNotification(userId, title, body, data = {}) {
    try {
      // Find user and get their FCM token
      const user = await User.findOne({ uid: userId });
      
      if (!user || !user.fcmToken) {
        console.log('User not found or no FCM token:', userId);
        return { success: false, error: 'User not found or no FCM token' };
      }

      const message = {
        token: user.fcmToken,
        notification: {
          title: title,
          body: body,
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK', // For React Native handling
          sound: 'default',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channel_id: 'booking_alerts',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent notification:', response);
      
      return { 
        success: true, 
        message: 'Notification sent successfully',
        response 
      };
    } catch (error) {
      console.error('Error sending push notification:', error);
      
      // If token is invalid, remove it from user
      if (error.code === 'messaging/registration-token-not-registered') {
        await User.findOneAndUpdate(
          { uid: userId },
          { $unset: { fcmToken: 1 } }
        );
        console.log('Removed invalid FCM token for user:', userId);
      }
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Send notification to multiple users
  async sendBulkNotifications(userIds, title, body, data = {}) {
    try {
      const users = await User.find({ uid: { $in: userIds } });
      const validTokens = users
        .filter(user => user.fcmToken)
        .map(user => user.fcmToken);

      if (validTokens.length === 0) {
        return { success: false, error: 'No valid FCM tokens found' };
      }

      const message = {
        tokens: validTokens,
        notification: {
          title: title,
          body: body,
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log('Bulk notification sent:', response);
      
      return { 
        success: true, 
        message: 'Bulk notifications sent successfully',
        response 
      };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // Send booking notification to vendor
  async sendBookingNotificationToVendor(booking, property) {
    try {
      const vendorId = property.vendorId;
      const customerName = booking.userName;
      const propertyName = property.name;

      const title = '📅 New Booking Request!';
      const body = `${customerName} wants to book "${propertyName}"`;
      
      const data = {
        type: 'NEW_BOOKING',
        bookingId: booking._id.toString(),
        propertyId: property._id.toString(),
        customerName: customerName,
        propertyName: propertyName,
        screen: 'BookingDetail', // Screen to navigate when tapped
        id: booking._id.toString(), // ID for navigation
      };

      const result = await this.sendPushNotification(vendorId, title, body, data);
      
      // Also save notification to database for history
      await this.saveNotificationToDB({
        userId: vendorId,
        title,
        body,
        data,
        type: 'BOOKING_REQUEST'
      });

      return result;
    } catch (error) {
      console.error('Error sending booking notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Save notification to database
  async saveNotificationToDB(notificationData) {
    try {
      const Notification = require('../models/Notification');
      await Notification.create(notificationData);
    } catch (error) {
      console.error('Error saving notification to DB:', error);
    }
  },
};

module.exports = NotificationController;