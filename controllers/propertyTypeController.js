const PropertyType = require("../models/PropertyType");
const { cloudinary } = require("../config/cloudinary");

// Helper function to generate thumbnail URL from main image URL
const generateThumbnailUrl = (imageUrl) => {
  if (!imageUrl) return "";

  try {
    // Extract public ID from Cloudinary URL
    const urlParts = imageUrl.split("hirehub");
    const publicIdWithExtension = `hirehub${urlParts[urlParts.length - 1]}`;
    const publicId = publicIdWithExtension.split(".")[0];
console.log('publicId', publicId);
    // Generate thumbnail URL with Cloudinary transformations
    const thumbnailUrl = cloudinary.url(publicId, {
      transformation: [
        {
          width: 200,
          height: 200,
          crop: "fill",
          gravity: "auto",
          quality: "auto",
          format: "webp",
        },
      ],
    });
const urlSplit = thumbnailUrl.split('http');
    const newThumbnailUrl = `https${urlSplit[1]}.webp`;
    
console.log('thumbnailUrl', thumbnailUrl);
console.log('newThumbnailUrl', newThumbnailUrl);
    return newThumbnailUrl;
  } catch (error) {
    console.error("Error generating thumbnail URL:", error);
    return ""; // Return empty string if generation fails
  }
};

// Alternative function that accepts Cloudinary upload result directly
const generateThumbnailFromUpload = (uploadResult) => {
  if (!uploadResult || !uploadResult.path) return "";

  try {
    // Use the public_id from upload result for more reliable thumbnail generation
    const publicId = uploadResult.filename; // This is the public_id without extension
    
    const thumbnailUrl = cloudinary.url(publicId, {
      transformation: [
        {
          width: 200,
          height: 200,
          crop: "fill",
          gravity: "auto",
          quality: "auto",
          format: "webp",
        },
      ],
    });

    return thumbnailUrl;
  } catch (error) {
    console.error("Error generating thumbnail from upload:", error);
    return "";
  }
};

// Function to generate multiple thumbnail sizes
const generateMultipleThumbnails = (imageUrl, sizes = [200, 400, 600]) => {
  if (!imageUrl) return {};

  try {
    const urlParts = imageUrl.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];

    const thumbnails = {};
    
    sizes.forEach(size => {
      thumbnails[`thumb${size}`] = cloudinary.url(publicId, {
        transformation: [
          {
            width: size,
            height: size,
            crop: "fill",
            gravity: "auto",
            quality: "auto",
            format: "webp",
          },
        ],
      });
    });

    return thumbnails;
  } catch (error) {
    console.error("Error generating multiple thumbnails:", error);
    return {};
  }
};

// helper function end 





// @desc    Get all property types (with filtering, sorting, pagination)
// @route   GET /api/property-types/customer-types
// @access  Public for active, Private/Admin for all
const getCustomerPropertyTypes = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "name", isActive, search } = req.query;

    // Build query
    let query = {};

    // If not admin, only show active property types
    if (req.user && req.user.userType !== "admin") {
      query.isActive = true;
    }

    // Filter by active status if provided (admin only)
    if (isActive !== undefined && req.user && req.user.userType === "admin") {
      query.isActive = isActive === "true";
    }

    // Search in name and description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
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
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get property types error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching property types",
    });
  }
};

// @desc    Get all property types (with filtering, sorting, pagination)
// @route   GET /api/property-types
// @access  Public for active, Private/Admin for all
const getPropertyTypes = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "name", isActive, search } = req.query;

    // Build query
    let query = {};

    // If not admin, only show active property types
    if (req.user && req.user.userType !== "admin") {
      query.isActive = true;
      // query.createdBy = req.user.uid;
    }


    // Filter by active status if provided (admin only)
    if (isActive !== undefined && req.user && req.user.userType === "admin") {
      query.isActive = isActive === "true";
      query.createdBy = req.user.uid;
      

    }

    // Search in name and description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const propertyTypes = await PropertyType.find(query)
      .sort(sort)
      // .limit(limit * 1)
      // .skip((page - 1) * limit)
      ;

    // Get total count for pagination
    const total = await PropertyType.countDocuments(query);

    res.status(200).json({
      success: true,
      data: propertyTypes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get property types error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching property types",
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
        error: "Property type not found",
      });
    }

    // If not admin and property type is inactive, return error
    if (req.user && req.user.userType !== "admin" && !propertyType.isActive) {
      return res.status(404).json({
        success: false,
        error: "Property type not found",
      });
    }

    res.status(200).json({
      success: true,
      data: propertyType,
    });
  } catch (error) {
    console.error("Get property type error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid property type ID format",
      });
    }
    res.status(500).json({
      success: false,
      error: "Server error while fetching property type",
    });
  }
};

// @desc    Create property type with image upload
// @route   POST /api/property-types
// @access  Private/Admin
const createPropertyType = async (req, res) => {
  try {
    const { name, description } = req.body;
    // Check if property type with same name already exists
    const existingPropertyType = await PropertyType.findOne({ name });
    if (existingPropertyType) {
      // Delete uploaded images if they exist
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(400).json({
        success: false,
        error: "Property type with this name already exists",
      });
    }

    // Get image URLs from uploaded files
    const iconImageUrl = req.file ? req.file.path : "";
// Replace the current thumbnail generation with:
const iconImageThumbUrl = iconImageUrl ? generateThumbnailUrl(iconImageUrl) : "";
    // const iconImageThumbUrl = req.file ?
    //   req.file.path.replace('/property-types/', '/property-types/thumbnails/').replace(/\.[^/.]+$/, '') : '';

    // // Generate thumbnail URL from main image
    // const iconImageThumbUrl = iconImageUrl
    //   ? generateThumbnailUrl(iconImageUrl)
    //   : "";

    // Create property type
    const propertyType = await PropertyType.create({
      name,
      description,
      iconImageUrl,
      iconImageThumbUrl,
      createdBy: req.user.uid,
      updatedBy: req.user.uid,
    });

    res.status(201).json({
      success: true,
      data: propertyType,
      message: "Property type created successfully",
    });
  } catch (error) {
    console.error("Create property type error:", error);

    // Delete uploaded images if error occurs
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (deleteError) {
        console.error("Error deleting uploaded image:", deleteError);
      }
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error while creating property type",
    });
  }
};

// @desc    Update property type with image upload
// @route   PUT /api/property-types/:id
// @access  Private/Admin
const updatePropertyType = async (req, res) => {
  try {
    let propertyType = await PropertyType.findById(req.params.id);

    if (!propertyType) {
      // Delete uploaded image if property type not found
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(404).json({
        success: false,
        error: "Property type not found",
      });
    }

    // Check for duplicate name
    if (req.body.name) {
      const duplicatePropertyType = await PropertyType.findOne({
        name: req.body.name,
        _id: { $ne: propertyType._id },
      });

      if (duplicatePropertyType) {
        // Delete uploaded image if duplicate found
        if (req.file) {
          await cloudinary.uploader.destroy(req.file.filename);
        }
        return res.status(400).json({
          success: false,
          error: "Property type with this name already exists",
        });
      }
    }

    // If new image is uploaded, delete old images
    if (req.file) {
      // Delete old images from Cloudinary
      if (propertyType.iconImageUrl) {
        const publicId = propertyType.iconImageUrl
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(`hirehub/property-types/${publicId}`);
      }
      if (propertyType.iconImageThumbUrl) {
        const thumbPublicId = propertyType.iconImageThumbUrl
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(
          `hirehub/property-types/thumbnails/${thumbPublicId}`
        );
      }

      // Set new image URLs
      req.body.iconImageUrl = req.file.path;
      console.log("req.file.path", req.body.iconImageUrl, req.file.path);
      // Replace the current thumbnail generation with:
req.body.iconImageThumbUrl = req.file ? generateThumbnailUrl(req.file.path) : "";
      // req.body.iconImageThumbUrl = req.file.path.replace('/property-types/', '/property-types/thumbnails/').replace(/\.[^/.]+$/, '');
      // req.body.iconImageThumbUrl = generateThumbnailUrl(req.file.path);
    } else {
      if (imageChanged = req.body.imageChanged === "true") {
        if (propertyType.iconImageUrl) {
          const publicId = propertyType.iconImageUrl
            .split("/")
            .pop()
            .split(".")[0];
          await cloudinary.uploader.destroy(
            `hirehub/property-types/${publicId}`
          );
        }
          if (propertyType.iconImageThumbUrl) {
          const thumbPublicId = propertyType.iconImageThumbUrl
            .split("/")
            .pop()
            .split(".")[0];
          await cloudinary.uploader.destroy(
          `hirehub/property-types/thumbnails/${thumbPublicId}`
        );
        }
      }
    }
    // Set updatedBy and updatedAt
    req.body.updatedBy = req.user.uid;
    req.body.updatedAt = Date.now();

    // Update property type
    propertyType = await PropertyType.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: propertyType,
      message: "Property type updated successfully",
    });
  } catch (error) {
    console.error("Update property type error:", error);

    // Delete uploaded image if error occurs
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (deleteError) {
        console.error("Error deleting uploaded image:", deleteError);
      }
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid property type ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error while updating property type",
    });
  }
};

// @desc    Delete property type and its images
// @route   DELETE /api/property-types/:id
// @access  Private/Admin
const deletePropertyType = async (req, res) => {
  try {
    const propertyType = await PropertyType.findById(req.params.id);

    if (!propertyType) {
      return res.status(404).json({
        success: false,
        error: "Property type not found",
      });
    }

    // Delete images from Cloudinary
    if (propertyType.iconImageUrl) {
      const publicId = propertyType.iconImageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`hirehub/property-types/${publicId}`);
    }
    if (propertyType.iconImageThumbUrl) {
      const thumbPublicId = propertyType.iconImageThumbUrl
        .split("/")
        .pop()
        .split(".")[0];
      await cloudinary.uploader.destroy(
        `hirehub/property-types/thumbnails/${thumbPublicId}`
      );
    }

    await PropertyType.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: "Property type deleted successfully",
    });
  } catch (error) {
    console.error("Delete property type error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid property type ID format",
      });
    }
    res.status(500).json({
      success: false,
      error: "Server error while deleting property type",
    });
  }
};

// Add this new function to handle image upload separately
const uploadPropertyTypeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }
// You can use it like this:
const thumbnailUrl = generateThumbnailUrl(req.file.path);
    res.status(200).json({
      success: true,
      data: {
        imageUrl: req.file.path,
        thumbnailUrl: thumbnailUrl ? thumbnailUrl : req.file.path
          .replace("/property-types/", "/property-types/thumbnails/")
          .replace(/\.[^/.]+$/, ""),
        publicId: req.file.filename,
      },
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Image upload error:", error);

    // Delete uploaded image if error occurs
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (deleteError) {
        console.error("Error deleting uploaded image:", deleteError);
      }
    }

    res.status(500).json({
      success: false,
      error: "Server error while uploading image",
    });
  }
};
// Keep other controller methods (getPropertyTypes, getPropertyType, deactivatePropertyType) the same
// ... (your existing code)

// @desc    Deactivate property type
// @route   PUT /api/property-types/:id/deactivate
// @access  Private/Admin
const deactivatePropertyType = async (req, res) => {
  try {
    const propertyType = await PropertyType.findById(req.params.id);

    if (!propertyType) {
      return res.status(404).json({
        success: false,
        error: "Property type not found",
      });
    }

    propertyType.isActive = false;
    propertyType.updatedBy = req.user.uid;
    propertyType.updatedAt = Date.now();
    await propertyType.save();

    res.status(200).json({
      success: true,
      data: propertyType,
      message: "Property type deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate property type error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while deactivating property type",
    });
  }
};

module.exports = {
  getPropertyTypes,
  getCustomerPropertyTypes,
  getPropertyType,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
  uploadPropertyTypeImage,
  deactivatePropertyType,
};
