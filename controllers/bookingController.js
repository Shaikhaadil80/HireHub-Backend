const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Transaction = require("../models/Transaction"); // Add this
const NotificationController = require("./notificationController");
// @desc    Create a new booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const {
      propertyId,
      userName,
      mobileNo,
      email,
      userRemark,
      bookforFromDateTime,
      bookforToDateTime,
      propertyCost,
      minAdvanced,
      paymentMode,
      nextslot,
      currrentPropertyJson,
      vendorId,
      totalAmount,
      duration,
      durationText,
    } = req.body;

    // Validate required fields
    if (!propertyId || !userName || !mobileNo || !email || !bookforFromDateTime || !bookforToDateTime) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // Check if property exists and is active
    const property = await Property.findById(propertyId);
    if (!property || !property.isActive) {
      return res.status(404).json({
        success: false,
        error: "Property not found or not active"
      });
    }

    // Validate date range
    const fromDate = new Date(bookforFromDateTime);
    const toDate = new Date(bookforToDateTime);
    
    if (fromDate >= toDate) {
      return res.status(400).json({
        success: false,
        error: "End time must be after start time"
      });
    }

    // Check for booking conflicts
    const hasConflict = await Booking.checkDateConflict(propertyId, fromDate, toDate);
    if (hasConflict) {
      return res.status(409).json({
        success: false,
        error: "The selected time slot is not available"
      });
    }

    // Validate duration based on unit
    const calculatedDuration = Booking.calculateDuration(property.unit, fromDate, toDate);
    
    // Unit-specific validation
    switch (property.unit) {
      case 'per_minute':
        if (calculatedDuration < 1) {
          return res.status(400).json({
            success: false,
            error: "Minimum booking duration is 1 minute"
          });
        }
        break;
      case 'per_hour':
        if (calculatedDuration < 1) {
          return res.status(400).json({
            success: false,
            error: "Minimum booking duration is 1 hour"
          });
        }
        break;
      case 'per_day':
        if (calculatedDuration < 1) {
          return res.status(400).json({
            success: false,
            error: "Minimum booking duration is 1 day"
          });
        }
        break;
      case 'per_month':
        if (calculatedDuration < 1) {
          return res.status(400).json({
            success: false,
            error: "Minimum booking duration is 1 month"
          });
        }
        break;
    }

    // Calculate price if not provided
    let finalTotalAmount = totalAmount;
    let finalDuration = duration;
    let finalDurationText = durationText;

    if (!totalAmount || !duration) {
      const priceCalculation = Booking.calculatePrice(property, fromDate, toDate);
      finalTotalAmount = priceCalculation.totalAmount;
      finalDuration = priceCalculation.duration;
      finalDurationText = priceCalculation.durationText;
    }

    // Create booking
    const booking = await Booking.create({
      uid: req.user.uid,
      userName,
      mobileNo,
      email,
      userRemark: userRemark || '',
      bookforFromDateTime: fromDate,
      bookforToDateTime: toDate,
      createdBy: req.user.uid,
      updatedBy: req.user.uid,
      status: 'Requested',
      propertyCost: propertyCost || property.price,
      minAdvanced: minAdvanced || property.minAdvanceBookingAmount,
      paymentStatus: 'unpaid',
      remainingAmount: finalTotalAmount,
      // remainingAmount: finalTotalAmount - (minAdvanced || property.minAdvanceBookingAmount),
      paymentMode: paymentMode || '',
      nextslot: nextslot || false,
      currrentPropertyJson: currrentPropertyJson || JSON.stringify(property),
      propertyId,
      vendorId: vendorId || property.vendorId,
      totalAmount: finalTotalAmount,
      duration: finalDuration,
      durationText : finalDurationText,
    });
    // Send notification to vendor
    try {
      // const property = await Property.findById(propertyId);
      await NotificationController.sendBookingNotificationToVendor(booking, property);
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the booking creation if notification fails
    }
    res.status(201).json({
      success: true,
      data: booking,
      message: "Booking created successfully"
    });

  } catch (error) {
    console.error("Create booking error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error while creating booking"
    });
  }
};


// @desc    Check bulk availability for multiple slots
// @route   POST /api/bookings/check-bulk-availability
// @access  Private
const checkBulkAvailability = async (req, res) => {
  try {
    const { propertyId, slots } = req.body;

    if (!propertyId || !slots || !Array.isArray(slots)) {
      return res.status(400).json({
        success: false,
        error: "Property ID and slots array are required"
      });
    }

    // Check if property exists and is active
    const property = await Property.findById(propertyId);
    if (!property || !property.isActive) {
      return res.status(404).json({
        success: false,
        error: "Property not found or not active"
      });
    }

    const availabilityMap = {};
    const availabilityPromises = [];

    // Process slots in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (slot) => {
        try {
          const fromDate = new Date(slot.start);
          const toDate = new Date(slot.end);
          
          // Validate date range
          if (fromDate >= toDate) {
            availabilityMap[slot.id] = false;
            return;
          }

          // Check for booking conflicts
          const hasConflict = await Booking.checkDateConflict(propertyId, fromDate, toDate);
          availabilityMap[slot.id] = !hasConflict;
        } catch (error) {
          console.error(`Error checking availability for slot ${slot.id}:`, error);
          availabilityMap[slot.id] = false;
        }
      });

      availabilityPromises.push(...batchPromises);
    }

    // Wait for all availability checks to complete
    await Promise.all(availabilityPromises);

    res.status(200).json({
      success: true,
      data: {
        propertyId,
        totalSlots: slots.length,
        availabilityMap
      }
    });

  } catch (error) {
    console.error("Bulk availability check error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while checking bulk availability"
    });
  }
};
//////////////////////////////////////////////////////////
// // controllers/bookingController.js (Optimized bulk availability)
// const checkBulkAvailability = async (req, res) => {
//   try {
//     const { propertyId, slots } = req.body;

//     if (!propertyId || !slots || !Array.isArray(slots)) {
//       return res.status(400).json({
//         success: false,
//         error: "Property ID and slots array are required"
//       });
//     }

//     // Check if property exists and is active
//     const property = await Property.findById(propertyId);
//     if (!property || !property.isActive) {
//       return res.status(404).json({
//         success: false,
//         error: "Property not found or not active"
//       });
//     }

//     // Create date ranges for all slots
//     const dateRanges = slots.map(slot => ({
//       start: new Date(slot.start),
//       end: new Date(slot.end),
//       id: slot.id
//     }));

//     // Single query to find all conflicting bookings
//     const conflictQuery = {
//       propertyId: propertyId,
//       status: { $in: ['Requested', 'Booked'] },
//       $or: dateRanges.map(range => ({
//         $and: [
//           { bookforFromDateTime: { $lt: range.end } },
//           { bookforToDateTime: { $gt: range.start } }
//         ]
//       }))
//     };

//     const conflictingBookings = await Booking.find(conflictQuery);

//     // Build availability map
//     const availabilityMap = {};
    
//     dateRanges.forEach(range => {
//       const hasConflict = conflictingBookings.some(booking => {
//         return (
//           booking.bookforFromDateTime < range.end &&
//           booking.bookforToDateTime > range.start
//         );
//       });
      
//       availabilityMap[range.id] = !hasConflict;
//     });

//     res.status(200).json({
//       success: true,
//       data: {
//         propertyId,
//         totalSlots: slots.length,
//         conflictingBookings: conflictingBookings.length,
//         availabilityMap
//       }
//     });

//   } catch (error) {
//     console.error("Bulk availability check error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Server error while checking bulk availability"
//     });
//   }
// };
//////////////////////////////////////////////////////////


// @desc    Get all bookings with filtering
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      startDate,
      endDate,
      sort = "-createdAt"
    } = req.query;

    // Build query
    let query = {};

    // For customers, only show their own bookings
    if (req.user.userType === 'customer') {
      query.uid = req.user.uid;
    }

    // For vendors, show bookings for their properties
    if (req.user.userType === 'vendor') {
      query.vendorId = req.user.uid;
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'upcoming') {
        query.bookforFromDateTime = { $gt: new Date() };
        query.status = { $in: ['Requested', 'Booked'] };
      } else if (status === 'ongoing') {
        const now = new Date();
        query.bookforFromDateTime = { $lte: now };
        query.bookforToDateTime = { $gte: now };
        query.status = 'Booked';
      } else if (status === 'completed') {
        query.bookforToDateTime = { $lt: new Date() };
        query.status = 'Completed';
      } else {
        query.status = status;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.bookforFromDateTime = {};
      if (startDate) query.bookforFromDateTime.$gte = new Date(startDate);
      if (endDate) query.bookforFromDateTime.$lte = new Date(endDate);
    }

    // Search in customer name, mobile, email
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { mobileNo: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Execute query with pagination
    const bookings = await Booking.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching bookings"
    });
  }
};

// @desc    Get vendor bookings (with customer info)
// @route   GET /api/bookings/vendor
// @access  Private/Vendor
const getVendorBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      startDate,
      endDate,
      sort = "-createdAt"
    } = req.query;

    // Build query for vendor's properties
    let query = { vendorId: req.user.uid };

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.bookforFromDateTime = {};
      if (startDate) query.bookforFromDateTime.$gte = new Date(startDate);
      if (endDate) query.bookforFromDateTime.$lte = new Date(endDate);
    }

    // Search in customer info
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { mobileNo: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Execute query with pagination
    const bookings = await Booking.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get vendor bookings error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching vendor bookings"
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    // Check permissions
    if (req.user.userType === 'customer' && booking.uid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    if (req.user.userType === 'vendor' && booking.vendorId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error("Get booking error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid booking ID format"
      });
    }
    res.status(500).json({
      success: false,
      error: "Server error while fetching booking"
    });
  }
};

// // @desc    Update booking
// // @route   PUT /api/bookings/:id
// // @access  Private
// const updateBooking = async (req, res) => {
//   try {
//     let booking = await Booking.findById(req.params.id);

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         error: "Booking not found"
//       });
//     }

//     // Check permissions
//     if (req.user.userType === 'customer' && booking.uid !== req.user.uid) {
//       return res.status(403).json({
//         success: false,
//         error: "Access denied"
//       });
//     }

//     if (req.user.userType === 'vendor' && booking.vendorId !== req.user.uid) {
//       return res.status(403).json({
//         success: false,
//         error: "Access denied"
//       });
//     }

//     // Validate status transitions
//     if (req.body.status) {
//       const allowedTransitions = {
//         'Requested': ['Booked', 'NotBooked', 'Cancelled'],
//         'Booked': ['Completed', 'Cancelled'],
//         'Completed': [],
//         'Cancelled': [],
//         'NotBooked': []
//       };

//       if (!allowedTransitions[booking.status].includes(req.body.status)) {
//         return res.status(400).json({
//           success: false,
//           error: `Cannot change status from ${booking.status} to ${req.body.status}`
//         });
//       }
//     }

//     // Update booking
//     req.body.updatedBy = req.user.uid;
//     req.body.updatedAt = Date.now();

//     booking = await Booking.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       {
//         new: true,
//         runValidators: true
//       }
//     );

//  // Send notification to customer when status changes
//     if (req.body.status && req.body.status !== booking.status) {
//       try {
//         const property = JSON.parse(booking.currrentPropertyJson);
//         let title, body;

//         switch(req.body.status) {
//           case 'Booked':
//             title = '✅ Booking Confirmed!';
//             body = `Your booking for "${property.name}" has been confirmed`;
//             break;
//           case 'NotBooked':
//             title = '❌ Booking Declined';
//             body = `Your booking for "${property.name}" was declined`;
//             break;
//           case 'Completed':
//             title = '🎉 Booking Completed';
//             body = `Your booking for "${property.name}" has been completed`;
//             break;
//           case 'Cancelled':
//             title = '📝 Booking Cancelled';
//             body = `Your booking for "${property.name}" has been cancelled`;
//             break;
//         }

//         if (title && body) {
//           await NotificationController.sendPushNotification(
//             booking.uid,
//             title,
//             body,
//             {
//               type: 'BOOKING_STATUS_UPDATE',
//               bookingId: booking._id.toString(),
//               propertyId: booking.propertyId,
//               status: req.body.status,
//               screen: 'BookingDetail',
//               id: booking._id.toString(),
//             }
//           );
//         }
//       } catch (notificationError) {
//         console.error('Failed to send status notification:', notificationError);
//       }
//     }
//     ///////////////////////

//     res.status(200).json({
//       success: true,
//       data: booking,
//       message: "Booking updated successfully"
//     });

//   } catch (error) {
//     console.error("Update booking error:", error);
    
//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         error: "Validation failed",
//         details: errors
//       });
//     }

//     if (error.name === "CastError") {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid booking ID format"
//       });
//     }

//     res.status(500).json({
//       success: false,
//       error: "Server error while updating booking"
//     });
//   }
// };

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const { remark } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    // Check permissions
    if (req.user.userType === 'customer' && booking.uid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    if (req.user.userType === 'vendor' && booking.vendorId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    // Check if booking can be cancelled
    if (!['Requested', 'Booked'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel booking with status: ${booking.status}`
      });
    }

    // Update booking status
    booking.status = 'Cancelled';
    booking.adminRemark = remark || `Cancelled by ${req.user.userType}`;
    booking.updatedBy = req.user.uid;
    booking.updatedAt = Date.now();

    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: "Booking cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while cancelling booking"
    });
  }
};

// @desc    Check booking availability
// @route   POST /api/bookings/check-availability
// @access  Private
const checkAvailability = async (req, res) => {
  try {
    const { propertyId, fromDateTime, toDateTime } = req.body;

    if (!propertyId || !fromDateTime || !toDateTime) {
      return res.status(400).json({
        success: false,
        error: "Property ID, from date, and to date are required"
      });
    }

    // Check if property exists and is active
    const property = await Property.findById(propertyId);
    if (!property || !property.isActive) {
      return res.status(404).json({
        success: false,
        error: "Property not found or not active"
      });
    }

    // Validate date range
    const fromDate = new Date(fromDateTime);
    const toDate = new Date(toDateTime);
    
    if (fromDate >= toDate) {
      return res.status(400).json({
        success: false,
        error: "End time must be after start time"
      });
    }

    // Check for booking conflicts
    const hasConflict = await Booking.checkDateConflict(propertyId, fromDate, toDate);

    res.status(200).json({
      success: true,
      available: !hasConflict,
      data: {
        propertyId,
        fromDateTime: fromDate,
        toDateTime: toDate,
        hasConflict
      }
    });

  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while checking availability"
    });
  }
};

// @desc    Calculate booking price
// @route   POST /api/bookings/calculate-price
// @access  Private
const calculatePrice = async (req, res) => {
  try {
    const { propertyId, fromDateTime, toDateTime } = req.body;

    if (!propertyId || !fromDateTime || !toDateTime) {
      return res.status(400).json({
        success: false,
        error: "Property ID, from date, and to date are required"
      });
    }

    // Check if property exists and is active
    const property = await Property.findById(propertyId);
    if (!property || !property.isActive) {
      return res.status(404).json({
        success: false,
        error: "Property not found or not active"
      });
    }

    // Validate date range
    const fromDate = new Date(fromDateTime);
    const toDate = new Date(toDateTime);
    
    if (fromDate >= toDate) {
      return res.status(400).json({
        success: false,
        error: "End time must be after start time"
      });
    }

    // Calculate price
    const priceCalculation = Booking.calculatePrice(property, fromDate, toDate);

    res.status(200).json({
      success: true,
      data: priceCalculation
    });

  } catch (error) {
    console.error("Calculate price error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while calculating price"
    });
  }
};

// @desc    Update booking payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private/Admin
const updateBookingPayment = async (req, res) => {
  try {
    const { paymentStatus, paymentMode, advanceAmount, referenceNumber, notes } = req.body;
    
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    // Check if user is admin
    if (req.user.userType !== 'admin' && req.user.userType !== 'vendor') {
      return res.status(403).json({
        success: false,
        error: "Access denied. Only admin can update payment status."
      });
    }

    // Validate payment data
    if (!paymentStatus || !paymentMode) {
      return res.status(400).json({
        success: false,
        error: "Payment status and payment mode are required"
      });
    }

    // Validate payment status transition
    const allowedTransitions = {
      'unpaid': ['advancePaid', 'paid'],
      'advancePaid': ['paid'],
      'paid': [] // No transitions from paid
    };

    if (!allowedTransitions[booking.paymentStatus]?.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change payment status from ${booking.paymentStatus} to ${paymentStatus}`
      });
    }

    let transactionAmount = 0;
    let transactionType = '';

    // Calculate amounts and create transaction based on payment status
    switch (paymentStatus) {
      case 'advancePaid':
        if (!advanceAmount || advanceAmount < booking.minAdvanced) {
          return res.status(400).json({
            success: false,
            error: `Advance amount must be at least ${booking.minAdvanced}`
          });
        }
        if (advanceAmount > booking.totalAmount) {
          return res.status(400).json({
            success: false,
            error: "Advance amount cannot exceed total amount"
          });
        }
        transactionAmount = advanceAmount;
        transactionType = 'advance_payment';
        booking.remainingAmount = booking.totalAmount - advanceAmount;
        break;

      case 'paid':
        transactionAmount = booking.paymentStatus === 'advancePaid' 
          ? booking.remainingAmount 
          : booking.totalAmount;
        transactionType = booking.paymentStatus === 'advancePaid' 
          ? 'remaining_payment' 
          : 'full_payment';
        booking.remainingAmount = 0;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid payment status"
        });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      bookingId: booking._id,
      amount: transactionAmount,
      paymentMode: paymentMode,
      paymentStatus: paymentStatus,
      transactionType: transactionType,
      referenceNumber: referenceNumber || '',
      notes: notes || '',
      createdBy: req.user.uid
    });

    // Update booking payment details
    booking.paymentStatus = paymentStatus;
    booking.paymentMode = paymentMode;
    booking.paymentDateTime = new Date();
    booking.updatedBy = req.user.uid;
    booking.updatedAt = Date.now();

    await booking.save();

    // Send notification to customer
    try {
      const property = JSON.parse(booking.currrentPropertyJson);
      let title, body;

      switch(paymentStatus) {
        case 'advancePaid':
          title = '💰 Advance Payment Received';
          body = `Advance payment of $${advanceAmount} for "${property.name}" has been received`;
          break;
        case 'paid':
          title = '✅ Payment Completed';
          body = `Full payment for "${property.name}" has been received`;
          break;
      }

      if (title && body) {
        await NotificationController.sendPushNotification(
          booking.uid,
          title,
          body,
          {
            type: 'BOOKING_PAYMENT_UPDATE',
            bookingId: booking._id.toString(),
            propertyId: booking.propertyId,
            paymentStatus: paymentStatus,
            screen: 'BookingDetail',
            id: booking._id.toString(),
          }
        );
      }
    } catch (notificationError) {
      console.error('Failed to send payment notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      data: {
        booking,
        transaction
      },
      message: `Payment status updated to ${paymentStatus}`
    });

  } catch (error) {
    console.error("Update booking payment error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid booking ID format"
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error while updating booking payment"
    });
  }
};

// @desc    Get transactions for a booking
// @route   GET /api/bookings/:id/transactions
// @access  Private/Admin
const getBookingTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ bookingId: req.params.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error("Get booking transactions error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching transactions"
    });
  }
};

// @desc    Update booking (modified to prevent payment status updates)
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
  try {
    // Remove payment-related fields from update data
    const { paymentStatus, paymentMode, advanceAmount, ...updateData } = req.body;
    
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    // Check permissions
    if (req.user.userType === 'customer' && booking.uid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    if (req.user.userType === 'vendor' && booking.vendorId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    // Validate status transitions
    if (updateData.status) {
      const allowedTransitions = {
        'Requested': ['Booked', 'NotBooked', 'Cancelled'],
        'Booked': ['Completed', 'Cancelled'],
        'Completed': [],
        'Cancelled': [],
        'NotBooked': []
      };

      if (!allowedTransitions[booking.status].includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          error: `Cannot change status from ${booking.status} to ${updateData.status}`
        });
      }
    }

    // Update booking
    updateData.updatedBy = req.user.uid;
    updateData.updatedAt = Date.now();

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    // Send notification for status changes (existing code)
    if (updateData.status && updateData.status !== booking.status) {
      // ... existing notification code ...
    }

    res.status(200).json({
      success: true,
      data: booking,
      message: "Booking updated successfully"
    });

  } catch (error) {
    console.error("Update booking error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid booking ID format"
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error while updating booking"
    });
  }
};

module.exports = {
  createBooking,
  checkBulkAvailability,
  getBookings,
  getVendorBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  checkAvailability,
  calculatePrice,
  updateBookingPayment, // Add this
  getBookingTransactions // Add this
};