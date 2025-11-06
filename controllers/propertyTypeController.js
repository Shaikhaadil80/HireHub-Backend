const PropertyType = require('../models/PropertyType');

// @desc    Get all property types (with filtering, sorting, pagination)
// @route   GET /api/property-types
// @access  Public for active, Private/Admin for all
const getPropertyTypes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'name',
      isActive,
      search
    } = req.query;

    // Build query
    let query = {};

    // If not admin, only show active property types
    if (req.user && req.user.userType !== 'admin') {
      query.isActive = true;
    }

    // Filter by active status if provided (admin only)
    if (isActive !== undefined && req.user && req.user.userType === 'admin') {
      query.isActive = isActive === 'true';
    }

    // Search in name and description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const propertyTypes = await PropertyType.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await PropertyType.countDocuments(query);

    res.status(200).json({
      success: true,
      data: propertyTypes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get property types error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching property types'
    });
  }
};

// @desc    Get single property type
// @route   GET /api/property-types/:id
// @access  Public for active, Private/Admin for all
const getPropertyType = async (req, res) => {
  try {
    const propertyType = await PropertyType.findById(req.params.id);

    if (!propertyType) {
      return res.status(404).json({
        success: false,
        error: 'Property type not found'
      });
    }

    // If not admin and property type is inactive, return error
    if (req.user && req.user.userType !== 'admin' && !propertyType.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Property type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: propertyType
    });

  } catch (error) {
    console.error('Get property type error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid property type ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while fetching property type'
    });
  }
};

// @desc    Create property type
// @route   POST /api/property-types
// @access  Private/Admin
const createPropertyType = async (req, res) => {
  try {
    const {
      name,
      description,
      iconImageUrl,
      iconImageThumbUrl
    } = req.body;
console.log('Create property type request body: ', req.body);
    // Check if property type with same name already exists
    const existingPropertyType = await PropertyType.findOne({ name });
    if (existingPropertyType) {
      return res.status(400).json({
        success: false,
        error: 'Property type with this name already exists'
      });
    }

    // Create property type
    const propertyType = await PropertyType.create({
      name,
      description,
      iconImageUrl: iconImageUrl || '',
      iconImageThumbUrl: iconImageThumbUrl || '',
      createdBy: req.user.uid,
      updatedBy: req.user.uid
    });

    res.status(201).json({
      success: true,
      data: propertyType,
      message: 'Property type created successfully'
    });

  } catch (error) {
    console.error('Create property type error:', error);
    
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
      error: 'Server error while creating property type'
    });
  }
};

// @desc    Update property type
// @route   PUT /api/property-types/:id
// @access  Private/Admin
const updatePropertyType = async (req, res) => {
  try {
    let propertyType = await PropertyType.findById(req.params.id);

    if (!propertyType) {
      return res.status(404).json({
        success: false,
        error: 'Property type not found'
      });
    }

    // Check for duplicate name
    if (req.body.name) {
      const duplicatePropertyType = await PropertyType.findOne({
        name: req.body.name,
        _id: { $ne: propertyType._id }
      });

      if (duplicatePropertyType) {
        return res.status(400).json({
          success: false,
          error: 'Property type with this name already exists'
        });
      }
    }

    // Set updatedBy
    req.body.updatedBy = req.user.uid;
    req.body.updatedAt = Date.now();

    // Update property type
    propertyType = await PropertyType.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: propertyType,
      message: 'Property type updated successfully'
    });

  } catch (error) {
    console.error('Update property type error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid property type ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while updating property type'
    });
  }
};

// @desc    Delete property type
// @route   DELETE /api/property-types/:id
// @access  Private/Admin
const deletePropertyType = async (req, res) => {
  try {
    const propertyType = await PropertyType.findById(req.params.id);

    if (!propertyType) {
      return res.status(404).json({
        success: false,
        error: 'Property type not found'
      });
    }

    await PropertyType.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: 'Property type deleted successfully'
    });

  } catch (error) {
    console.error('Delete property type error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid property type ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while deleting property type'
    });
  }
};

// @desc    Deactivate property type
// @route   PUT /api/property-types/:id/deactivate
// @access  Private/Admin
const deactivatePropertyType = async (req, res) => {
  try {
    const propertyType = await PropertyType.findById(req.params.id);

    if (!propertyType) {
      return res.status(404).json({
        success: false,
        error: 'Property type not found'
      });
    }

    propertyType.isActive = false;
    propertyType.updatedBy = req.user.uid;
    propertyType.updatedAt = Date.now();
    await propertyType.save();

    res.status(200).json({
      success: true,
      data: propertyType,
      message: 'Property type deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate property type error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deactivating property type'
    });
  }
};

module.exports = {
  getPropertyTypes,
  getPropertyType,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
  deactivatePropertyType
};