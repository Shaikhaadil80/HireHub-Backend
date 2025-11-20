// controllers/propertyController.js
const Property = require("../models/Property");
const Favorite = require("../models/Favorite");
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
          width: 600,
          height: 800,
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

// @desc    Get all properties (with filtering, sorting, pagination)
// @route   GET /api/properties
// @access  Public for active, Private/Admin for all
const getProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "name", isActive, search, minPrice, maxPrice, unit } = req.query;

    // Build query
    let query = {};

    // If not admin, only show active properties
    if (req.user && req.user.userType !== "admin") {
      query.isActive = true;
      query.createdBy = req.user.uid;
    }

    // Filter by active status if provided (admin only)
    if (isActive !== undefined && req.user && req.user.userType === "admin") {
      query.isActive = isActive === "true";
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Unit filter
    if (unit) {
      query.unit = unit;
    }

    // Search in name and description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const properties = await Property.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Property.countDocuments(query);

    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get properties error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching properties",
    });
  }
};

// @desc    Get all properties (with filtering, sorting, pagination)
// @route   GET /api/properties/customer
// @access  Public for active, Private/Admin for all
// Update getCustomerProperties to include ratings
const getCustomerProperties = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = "name", 
      isActive = "true",
      search, 
      minPrice, 
      maxPrice, 
      unit 
    } = req.query;

    // Build query - only active properties for customers
    let query = { isActive: true };

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Unit filter
    if (unit) {
      query.unit = unit;
    }

    // Search in name and description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const properties = await Property.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Property.countDocuments(query);

    // Populate with extras (without favorite since it's public endpoint)
    const customerId = req.user ? req.user.uid : null;

    const propertiesWithExtras = await populatePropertyExtras(properties,customerId);

    res.status(200).json({
      success: true,
      data: propertiesWithExtras,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get customer properties error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching properties",
    });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public for active, Private/Admin for all
// Update getProperty to include ratings and favorites
const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    // If not admin and property is inactive, return error
    if (req.user && req.user.userType !== "admin" && !property.isActive) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    // Populate with extras including favorite status if user is logged in
    const customerId = req.user ? req.user.uid : null;
    const propertyWithExtras = (await populatePropertyExtras([property], customerId))[0];

    res.status(200).json({
      success: true,
      data: propertyWithExtras,
    });
  } catch (error) {
    console.error("Get property error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID format",
      });
    }
    res.status(500).json({
      success: false,
      error: "Server error while fetching property",
    });
  }
};


// Helper function to delete images from Cloudinary
const deleteCloudinaryImages = async (imageUrls, folder) => {
  for (const imageUrl of imageUrls) {
    if (imageUrl) {
      try {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`hirehub/properties/${folder}/${publicId}`);
      } catch (error) {
        console.error(`Error deleting image from ${folder}:`, error);
      }
    }
  }
};

// @desc    Create property with image upload
// @route   POST /api/properties
// @access  Private/Admin
const createProperty = async (req, res) => {
  try {
    const { name, description, unit, price, discountAmount, minAdvanceBookingAmount, propertyType, propertyTypeId, } = req.body;

    // Check if property with same name already exists
    const existingProperty = await Property.findOne({ name });
    if (existingProperty) {
      // Delete uploaded images if they exist
      if (req.files && req.files.mainImages) {
        await deleteCloudinaryImages(req.files.mainImages.map(file => file.path), 'main');
      }
      if (req.files && req.files.thumbnailImage) {
        await deleteCloudinaryImages(req.files.thumbnailImage.map(file => file.path), 'thumbnails');
      }
      return res.status(400).json({
        success: false,
        error: "Property with this name already exists",
      });
    }

    // Get image URLs from uploaded files
    const mainImageUrls = req.files && req.files.mainImages 
      ? req.files.mainImages.map(file => file.path) 
      : [];
    
    const thumbnailUrl = req.files && req.files.thumbnailImage && req.files.thumbnailImage[0]
      ? req.files.thumbnailImage[0].path 
      : "";
      const newThumbnailUrl = thumbnailUrl ? generateThumbnailUrl(thumbnailUrl):"";

    // Validate required images
    if (!thumbnailUrl) {
      // Clean up uploaded main images if thumbnail is missing
      if (mainImageUrls.length > 0) {
        await deleteCloudinaryImages(mainImageUrls, 'main');
      }
      return res.status(400).json({
        success: false,
        error: "Thumbnail image is required",
      });
    }

    if (mainImageUrls.length === 0) {
      // Clean up uploaded thumbnail if main images are missing
      if (thumbnailUrl) {
        await deleteCloudinaryImages([thumbnailUrl], 'thumbnails');
      }
      return res.status(400).json({
        success: false,
        error: "At least one main image is required",
      });
    }
console.log("Creating property with data:",);
    // Create property
    const property = await Property.create({
      name,
      description,
      iconImageUrls: mainImageUrls,
      iconImageThumbUrl: thumbnailUrl,
      iconImageThumbUrlResized : newThumbnailUrl,
      unit,
      price: parseFloat(price),
      discountAmount: discountAmount ? parseFloat(discountAmount) : 0,
      minAdvanceBookingAmount: parseFloat(minAdvanceBookingAmount),
      propertyType: propertyType,
      propertyTypeId: propertyTypeId,
      vendorName : req.user.userName,
      vendorId : req.user.uid,
      createdBy: req.user.uid,
      updatedBy: req.user.uid,

    });

    res.status(201).json({
      success: true,
      data: property,
      message: "Property created successfully",
    });
  } catch (error) {
    console.error("Create property error:", error);

    // Delete uploaded images if error occurs
    if (req.files) {
      if (req.files.mainImages) {
        await deleteCloudinaryImages(req.files.mainImages.map(file => file.path), 'main');
      }
      if (req.files.thumbnailImage) {
        await deleteCloudinaryImages(req.files.thumbnailImage.map(file => file.path), 'thumbnails');
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
      error: "Server error while creating property",
    });
  }
};

// @desc    Update property with image upload
// @route   PUT /api/properties/:id
// @access  Private/Admin
const updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      // Delete uploaded images if property not found
      if (req.files) {
        if (req.files.mainImages) {
          await deleteCloudinaryImages(req.files.mainImages.map(file => file.path), 'main');
        }
        if (req.files.thumbnailImage) {
          await deleteCloudinaryImages(req.files.thumbnailImage.map(file => file.path), 'thumbnails');
        }
      }
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    // Check for duplicate name
    if (req.body.name) {
      const duplicateProperty = await Property.findOne({
        name: req.body.name,
        _id: { $ne: property._id },
      });

      if (duplicateProperty) {
        // Delete uploaded images if duplicate found
        if (req.files) {
          if (req.files.mainImages) {
            await deleteCloudinaryImages(req.files.mainImages.map(file => file.path), 'main');
          }
          if (req.files.thumbnailImage) {
            await deleteCloudinaryImages(req.files.thumbnailImage.map(file => file.path), 'thumbnails');
          }
        }
        return res.status(400).json({
          success: false,
          error: "Property with this name already exists",
        });
      }
    }

    // Handle new thumbnail upload
    if (req.files && req.files.thumbnailImage && req.files.thumbnailImage[0]) {
      // Delete old thumbnail
      if (property.iconImageThumbUrl) {
        await deleteCloudinaryImages([property.iconImageThumbUrl], 'thumbnails');
      }
      req.body.iconImageThumbUrl = req.files.thumbnailImage[0].path;
      const thumbnailUrl = req.body.iconImageThumbUrl ? generateThumbnailUrl(req.body.iconImageThumbUrl):"";
      req.body.iconImageThumbUrlResized = thumbnailUrl;
    }

    // Handle new main images upload
    if (req.files && req.files.mainImages && req.files.mainImages.length > 0) {
      const newImageUrls = req.files.mainImages.map(file => file.path);
      // Add new images to existing ones (or replace if removing old ones)
      if (req.body.removedImages) {
        const removedImages = JSON.parse(req.body.removedImages);
        if (removedImages.length > 0) {
          await deleteCloudinaryImages(removedImages, 'main');
          // Keep only the images that weren't removed
          const remainingImages = property.iconImageUrls.filter(
            url => !removedImages.includes(url)
          );
          req.body.iconImageUrls = [...remainingImages, ...newImageUrls];
        } else {
          req.body.iconImageUrls = [...property.iconImageUrls, ...newImageUrls];
        }
      } else {
        req.body.iconImageUrls = [...property.iconImageUrls, ...newImageUrls];
      }
    } else if (req.body.removedImages) {
      // Handle only image removal without new uploads
      const removedImages = JSON.parse(req.body.removedImages);
      if (removedImages.length > 0) {
        await deleteCloudinaryImages(removedImages, 'main');
        req.body.iconImageUrls = property.iconImageUrls.filter(
          url => !removedImages.includes(url)
        );
      }
    }

    // Set updatedBy and updatedAt
    req.body.updatedBy = req.user.uid;
    req.body.updatedAt = Date.now();

    // Parse numeric fields
    if (req.body.price) req.body.price = parseFloat(req.body.price);
    if (req.body.discountAmount) req.body.discountAmount = parseFloat(req.body.discountAmount);
    if (req.body.minAdvanceBookingAmount) req.body.minAdvanceBookingAmount = parseFloat(req.body.minAdvanceBookingAmount);
    // NEW: Handle property type updates
    if (req.body.propertyType) {
      req.body.propertyType = req.body.propertyType;
    }
    if (req.body.propertyTypeId) {
      req.body.propertyTypeId = req.body.propertyTypeId;
    }
    if (req.body.vendorName === "") {
      req.body.vendorId = req.user.userName;
    }
    if (req.body.vendorId === "") {
      req.body.vendorId = req.user.uid;
    }
    // Update property
    property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: property,
      message: "Property updated successfully",
    });
  } catch (error) {
    console.error("Update property error:", error);

    // Delete uploaded images if error occurs
    if (req.files) {
      if (req.files.mainImages) {
        await deleteCloudinaryImages(req.files.mainImages.map(file => file.path), 'main');
      }
      if (req.files.thumbnailImage) {
        await deleteCloudinaryImages(req.files.thumbnailImage.map(file => file.path), 'thumbnails');
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
        error: "Invalid property ID format",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error while updating property",
    });
  }
};

// @desc    Upload property images separately
// @route   POST /api/properties/upload-images
// @access  Private/Admin
const uploadPropertyImages = async (req, res) => {
  try {
    const mainImages = req.files && req.files.mainImages ? req.files.mainImages : [];
    const thumbnail = req.files && req.files.thumbnailImage ? req.files.thumbnailImage[0] : null;

    if (mainImages.length === 0 && !thumbnail) {
      return res.status(400).json({
        success: false,
        error: "No image files provided",
      });
    }

    const response = {
      success: true,
      data: {},
      message: "Images uploaded successfully",
    };

    if (thumbnail) {
      response.data.thumbnail = {
        url: thumbnail.path,
        publicId: thumbnail.filename,
      };
    }

    if (mainImages.length > 0) {
      response.data.mainImages = mainImages.map(file => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Property image upload error:", error);

    // Delete uploaded images if error occurs
    if (req.files) {
      if (req.files.mainImages) {
        await deleteCloudinaryImages(req.files.mainImages.map(file => file.path), 'main');
      }
      if (req.files.thumbnailImage) {
        await deleteCloudinaryImages(req.files.thumbnailImage.map(file => file.path), 'thumbnails');
      }
    }

    res.status(500).json({
      success: false,
      error: "Server error while uploading images",
    });
  }
};

// @desc    Delete property and its images
// @route   DELETE /api/properties/:id
// @access  Private/Admin
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    // Delete all images from Cloudinary
    if (property.iconImageUrls.length > 0) {
      await deleteCloudinaryImages(property.iconImageUrls, 'main');
    }
    if (property.iconImageThumbUrl) {
      await deleteCloudinaryImages([property.iconImageThumbUrl], 'thumbnails');
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Delete property error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID format",
      });
    }
    res.status(500).json({
      success: false,
      error: "Server error while deleting property",
    });
  }
};

// @desc    Deactivate property
// @route   PUT /api/properties/:id/deactivate
// @access  Private/Admin
const deactivateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    property.isActive = false;
    property.updatedBy = req.user.uid;
    property.updatedAt = Date.now();
    await property.save();

    res.status(200).json({
      success: true,
      data: property,
      message: "Property deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate property error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while deactivating property",
    });
  }
};
// Helper to populate ratings and favorites
const populatePropertyExtras = async (properties, customerId = null) => {
  if (!properties || properties.length === 0) return properties;

  // If it's a single property, convert to array
  const propertiesArray = Array.isArray(properties) ? properties : [properties];
  
  const propertyIds = propertiesArray.map(p => p._id);

  // Get favorite status if customerId provided
  let favoriteMap = {};

  if (customerId) {
    const favorites = await Favorite.find({ 
      customerId, 
      propertyId: { $in: propertyIds } 
    });

    favoriteMap = favorites.reduce((acc, fav) => {
      acc[fav.propertyId.toString()] = true;
      return acc;
    }, {});
  }
  // Enhance properties with favorite status and ensure rating fields exist
  return propertiesArray.map(property => ({
    ...property.toObject ? property.toObject() : property,
    isFavorite: !!favoriteMap[property._id.toString()],
    averageRating: property.averageRating || 0,
    totalRatings: property.totalRatings || 0
  }));
};

module.exports = {
  getProperties,
  getCustomerProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  deactivateProperty,
  uploadPropertyImages,
};