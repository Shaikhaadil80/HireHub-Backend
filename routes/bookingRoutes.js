const express = require('express');
const {
  createBooking,
  getBookings,
  getVendorBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  checkAvailability,
  calculatePrice,
  checkBulkAvailability, // Add this
  updateBookingPayment,
  getBookingTransactions,
} = require('../controllers/bookingController');
const { verifyFirebaseToken, requireUserInDB } = require('../middleware/firebaseAuth');
const { authorize,protect } = require('../middleware/auth');


const router = express.Router();

// Firebase protected routes
router.use(verifyFirebaseToken);
router.use(requireUserInDB);



// Booking routes
router.post('/', createBooking);
router.get('/', getBookings);
router.get('/vendor', getVendorBookings);
router.get('/:id', getBooking);
router.put('/:id', updateBooking);
router.put('/:id/cancel', cancelBooking);

// Utility routes
router.post('/check-availability', checkAvailability);
router.post('/check-bulk-availability', checkBulkAvailability); // Add this route
router.post('/calculate-price', calculatePrice);

// router.use(authorize('vendor'));

// Payment routes (Admin only)
router.put('/:id/payment', updateBookingPayment);
router.get('/:id/transactions', getBookingTransactions);

module.exports = router;