const User = require('../models/User');
const { updateUserValidation } = require('../utils/validation');

// @desc    Get all users (with filtering, sorting, pagination)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      userType,
      isActive,
      search
    } = req.query;

    // Build query
    let query = {};

    // Filter by userType
    if (userType) {
      query.userType = userType;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search in username and email
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const users = await User.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users'
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has permission (admin or own profile)
    if (req.user.userType !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this user'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    // Validate request data
    const { error } = updateUserValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has permission (admin or own profile)
    if (req.user.userType !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this user'
      });
    }

    // Prevent certain fields from being updated
    const restrictedFields = ['_id', 'uid', 'createdAt', 'createdBy', 'password'];
    restrictedFields.forEach(field => delete req.body[field]);

    // Check for duplicate email or mobile
    if (req.body.email || req.body.mobileNo) {
      const duplicateQuery = {
        _id: { $ne: user._id },
        $or: []
      };

      if (req.body.email) {
        duplicateQuery.$or.push({ email: req.body.email });
      }
      if (req.body.mobileNo) {
        duplicateQuery.$or.push({ mobileNo: req.body.mobileNo });
      }

      const duplicateUser = await User.findOne(duplicateQuery);
      if (duplicateUser) {
        return res.status(400).json({
          success: false,
          error: 'Email or mobile number already exists'
        });
      }
    }

    // Set updatedBy
    req.body.updatedBy = req.user.id;

    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while updating user'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent self-deletion
    if (req.user.id === user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while deleting user'
    });
  }
};

// @desc    Deactivate user
// @route   PUT /api/users/:id/deactivate
// @access  Private/Admin
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.isActive = false;
    user.updatedBy = req.user.id;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deactivating user'
    });
  }
};

// @desc    Check if user exists by email
// @route   GET /api/users/check-email/:email
// @access  Public
const checkUserExists = async (req, res) => {
  try {
    const { email } = req.params;

    // Basic email validation
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        exists: false,
        error: 'Please provide a valid email address'
      });
    }

    // Check if user exists with this email
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    // Return boolean response
    res.status(200).json({
      success: true,
      exists: !!user, // Convert to boolean
      data: {
        email: email.toLowerCase(),
        exists: !!user
      }
    });

  } catch (error) {
    console.error('Check user exists error:', error);
    res.status(500).json({
      success: false,
      exists: false,
      error: 'Server error while checking user existence'
    });
  }
};
module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  checkUserExists
};