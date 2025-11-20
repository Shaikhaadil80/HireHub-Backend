const Booking = require("../models/Booking");

const validateBookingDates = async (req, res, next) => {
  try {
    const { propertyId, bookforFromDateTime, bookforToDateTime } = req.body;

    if (!propertyId || !bookforFromDateTime || !bookforToDateTime) {
      return res.status(400).json({
        success: false,
        error: "Property ID, from date, and to date are required"
      });
    }

    const fromDate = new Date(bookforFromDateTime);
    const toDate = new Date(bookforToDateTime);

    // Basic date validation
    if (fromDate >= toDate) {
      return res.status(400).json({
        success: false,
        error: "End time must be after start time"
      });
    }

    if (fromDate < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Cannot book for past dates"
      });
    }

    // Check for booking conflicts
    const hasConflict = await Booking.checkDateConflict(
      propertyId, 
      fromDate, 
      toDate,
      req.params.id // exclude current booking for updates
    );

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        error: "The selected time slot is not available"
      });
    }

    next();
  } catch (error) {
    console.error("Booking validation error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during booking validation"
    });
  }
};

const validateUnitSpecificRules = async (req, res, next) => {
  try {
    const { propertyId, bookforFromDateTime, bookforToDateTime } = req.body;

    if (!propertyId) {
      return next();
    }

    // Get property to check unit
    const Property = require("../models/Property");
    const property = await Property.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found"
      });
    }

    const fromDate = new Date(bookforFromDateTime);
    const toDate = new Date(bookforToDateTime);
    const duration = Booking.calculateDuration(property.unit, fromDate, toDate);

    // Unit-specific validation
    switch (property.unit) {
      case 'per_minute':
        if (duration < 1) {
          return res.status(400).json({
            success: false,
            error: "Minimum booking duration is 1 minute"
          });
        }
        if (duration > 1440) { // 24 hours in minutes
          return res.status(400).json({
            success: false,
            error: "Maximum booking duration for per_minute unit is 24 hours"
          });
        }
        break;

      case 'per_hour':
        if (duration < 1) {
          return res.status(400).json({
            success: false,
            error: "Minimum booking duration is 1 hour"
          });
        }
        if (duration > 24) {
          return res.status(400).json({
            success: false,
            error: "Maximum booking duration for per_hour unit is 24 hours"
          });
        }
        // Validate hour boundaries (e.g., should start and end at hour boundaries)
        if (fromDate.getMinutes() !== 0 || toDate.getMinutes() !== 0) {
          return res.status(400).json({
            success: false,
            error: "Hourly bookings must start and end at exact hours (e.g., 1:00, 2:00)"
          });
        }
        break;

      case 'per_day':
        if (duration < 1) {
          return res.status(400).json({
            success: false,
            error: "Minimum booking duration is 1 day"
          });
        }
        if (duration > 30) {
          return res.status(400).json({
            success: false,
            error: "Maximum booking duration for per_day unit is 30 days"
          });
        }
        // Validate day boundaries (should start and end at midnight)
        if (fromDate.getHours() !== 0 || fromDate.getMinutes() !== 0 || 
            toDate.getHours() !== 0 || toDate.getMinutes() !== 0) {
          return res.status(400).json({
            success: false,
            error: "Daily bookings must be for full days (start and end at midnight)"
          });
        }
        break;

      case 'per_month':
        if (duration < 1) {
          return res.status(400).json({
            success: false,
            error: "Minimum booking duration is 1 month"
          });
        }
        if (duration > 12) {
          return res.status(400).json({
            success: false,
            error: "Maximum booking duration for per_month unit is 12 months"
          });
        }
        // Validate month boundaries (should start on 1st and end on last day)
        if (fromDate.getDate() !== 1) {
          return res.status(400).json({
            success: false,
            error: "Monthly bookings must start on the 1st day of the month"
          });
        }
        const lastDay = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0);
        if (toDate.getDate() !== lastDay.getDate()) {
          return res.status(400).json({
            success: false,
            error: "Monthly bookings must end on the last day of the month"
          });
        }
        break;
    }

    next();
  } catch (error) {
    console.error("Unit validation error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during unit validation"
    });
  }
};

module.exports = {
  validateBookingDates,
  validateUnitSpecificRules
};