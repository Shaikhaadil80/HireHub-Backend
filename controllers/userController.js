const User = require('../models/User');
const { updateUserValidation } = require('../utils/validation');

// @desc    Create user profile after Firebase auth
// @route   POST /api/users
// @access  Private (Firebase authenticated)
const createUser = async (req, res) => {
  try {
    const {
      userName,
      userType,
      profileImageUrl,
      profileImageThumbUrl,
      mobileNo,
      email,
      subscriptionTillDate,
      subscriptionId
    } = req.body;
console.log("userType",userType);
    // Check if user already exists with this UID
    const existingUser = await User.findOne({ uid: req.firebaseUser.uid });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User profile already exists'
      });
    }

    // Check if email or mobile already exists
    const duplicateUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { mobileNo: mobileNo }
      ]
    });

    if (duplicateUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or mobile number already exists'
      });
    }

    // Create new user
    const user = await User.create({
      uid: req.firebaseUser.uid,
      userName,
      userType,
      profileImageUrl: profileImageUrl || '',
      profileImageThumbUrl: profileImageThumbUrl || '',
      mobileNo,
      email: email.toLowerCase(),
      createdBy: req.firebaseUser.uid,
      subscriptionTillDate,
      subscriptionId,
      emailVerified: req.firebaseUser.email_verified || false,
      firebaseProvider: req.firebaseUser.firebase.sign_in_provider
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User profile created successfully'
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'User with this UID, email or mobile number already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while creating user profile'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private (Firebase authenticated)
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: req.user
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private (Firebase authenticated)
const updateUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Validate request data
    const { error } = updateUserValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Prevent updating restricted fields
    const restrictedFields = ['_id', 'uid', 'email', 'createdAt', 'createdBy'];
    restrictedFields.forEach(field => delete req.body[field]);

    // Check for duplicate mobile number
    if (req.body.mobileNo) {
      const duplicateUser = await User.findOne({
        mobileNo: req.body.mobileNo,
        _id: { $ne: req.user._id }
      });

      if (duplicateUser) {
        return res.status(400).json({
          success: false,
          error: 'Mobile number already exists'
        });
      }
    }

    // Set updatedBy
    req.body.updatedBy = req.firebaseUser.uid;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: user,
      message: 'User profile updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while updating user profile'
    });
  }
};

// @desc    Check if user exists by email (public)
// @route   GET /api/users/check-email/:email
// @access  Public
const checkUserExists = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        exists: false,
        error: 'Email is required'
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    res.status(200).json({
      success: true,
      exists: !!user,
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

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Firebase authenticated)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Basic authorization - users can only see their own profile or admin can see all
    if (req.user.uid !== user.uid && req.user.userType !== 'admin') {
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
    console.error('Get user by ID error:', error);
    
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


// @desc    Check if user profile exists by Firebase UID
// @route   GET /api/users/check-profile/:uid
// @access  Private (Firebase authenticated)
const checkUserProfileExists = async (req, res) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ 
      uid: uid,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      exists: !!user,
      data: user || null
    });

  } catch (error) {
    console.error('Check user profile exists error:', error);
    res.status(500).json({
      success: false,
      exists: false,
      error: 'Server error while checking user profile'
    });
  }
};

module.exports = {
  createUser,
  getCurrentUser,
  updateUser,
  checkUserExists,
  getUserById,
  checkUserProfileExists
};