// // controllers/propertyController.js
// const Property = require("../models/Property");
// const { cloudinary } = require("../config/cloudinary");

// // Helper function to delete images from Cloudinary
// const deleteCloudinaryImages = async (imageUrls, folder) => {
//   for (const imageUrl of imageUrls) {
//     if (imageUrl) {
//       try {
//         const publicId = imageUrl.split('/').pop().split('.')[0];
//         await cloudinary.uploader.destroy(`hirehub/properties/${folder}/${publicId}`);
//       } catch (error) {
//         console.error(`Error deleting image from ${folder}:`, error);
//       }
//     }
//   }
// };

// // @desc    Get all properties (with filtering, sorting, pagination)
// // @route   GET /api/properties
// // @access  Public for active, Private/Admin for all
// const getProperties = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, sort = "name", isActive, search, minPrice, maxPrice, unit } = req.query;

//     // Build query
//     let query = {};

//     // If not admin, only show active properties
//     if (req.user && req.user.userType !== "admin") {
//       query.isActive = true;
//     }

//     // Filter by active status if provided (admin only)
//     if (isActive !== undefined && req.user && req.user.userType === "admin") {
//       query.isActive = isActive === "true";
//     }

//     // Price range filter
//     if (minPrice || maxPrice) {
//       query.price = {};
//       if (minPrice) query.price.$gte = parseFloat(minPrice);
//       if (maxPrice) query.price.$lte = parseFloat(maxPrice);
//     }

//     // Unit filter
//     if (unit) {
//       query.unit = unit;
//     }

//     // Search in name and description
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // Execute query with pagination
//     const properties = await Property.find(query)
//       .sort(sort)
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     // Get total count for pagination
//     const total = await Property.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       data: properties,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Get properties error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Server error while fetching properties",
//     });
//   }
// };

// // @desc    Get single property
// // @route   GET /api/properties/:id
// // @access  Public for active, Private/Admin for all
// const getProperty = async (req, res) => {
//   try {
//     const property = await Property.findById(req.params.id);

//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         error: "Property not found",
//       });
//     }

//     // If not admin and property is inactive, return error
//     if (req.user && req.user.userType !== "admin" && !property.isActive) {
//       return res.status(404).json({
//         success: false,
//         error: "Property not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: property,
//     });
//   } catch (error) {
//     console.error("Get property error:", error);
//     if (error.name === "CastError") {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid property ID format",
//       });
//     }
//     res.status(500).json({
//       success: false,
//       error: "Server error while fetching property",
//     });
//   }
// };

// // @desc    Create property with image upload
// // @route   POST /api/properties
// // @access  Private/Admin
// const createProperty = async (req, res) => {
//   try {
//     const { name, description, unit, price, discountAmount, minAdvanceBookingAmount } = req.body;

//     // Check if property with same name already exists
//     const existingProperty = await Property.findOne({ name });
//     if (existingProperty) {
//       // Delete uploaded images if they exist
//       if (req.files && req.files.length > 0) {
//         await deleteCloudinaryImages(req.files.map(file => file.path), 'main');
//       }
//       if (req.file) {
//         await deleteCloudinaryImages([req.file.path], 'thumbnails');
//       }
//       return res.status(400).json({
//         success: false,
//         error: "Property with this name already exists",
//       });
//     }

//     // Get image URLs from uploaded files
//     // const mainImageUrls = req.files ? req.files.map(file => file.path) : [];
//     // const thumbnailUrl = req.file ? req.file.path : "";
//         const mainImageUrls = req.files && req.files.mainImages 
//       ? req.files.mainImages.map(file => file.path) 
//       : [];
    
//     const thumbnailUrl = req.files && req.files.thumbnailImage && req.files.thumbnailImage[0]
//       ? req.files.thumbnailImage[0].path 
//       : "";

//     // Create property
//     const property = await Property.create({
//       name,
//       description,
//       iconImageUrls: mainImageUrls,
//       iconImageThumbUrl: thumbnailUrl,
//       unit,
//       price: parseFloat(price),
//       discountAmount: discountAmount ? parseFloat(discountAmount) : 0,
//       minAdvanceBookingAmount: parseFloat(minAdvanceBookingAmount),
//       createdBy: req.user.uid,
//       updatedBy: req.user.uid,
//     });

//     res.status(201).json({
//       success: true,
//       data: property,
//       message: "Property created successfully",
//     });
//   } catch (error) {
//     console.error("Create property error:", error);

//     // Delete uploaded images if error occurs
//     if (req.files && req.files.length > 0) {
//       await deleteCloudinaryImages(req.files.map(file => file.path), 'main');
//     }
//     if (req.file) {
//       await deleteCloudinaryImages([req.file.path], 'thumbnails');
//     }

//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((err) => err.message);
//       return res.status(400).json({
//         success: false,
//         error: "Validation failed",
//         details: errors,
//       });
//     }

//     res.status(500).json({
//       success: false,
//       error: "Server error while creating property",
//     });
//   }
// };

// // @desc    Update property with image upload
// // @route   PUT /api/properties/:id
// // @access  Private/Admin
// const updateProperty = async (req, res) => {
//   try {
//     let property = await Property.findById(req.params.id);

//     if (!property) {
//       // Delete uploaded images if property not found
//       if (req.files && req.files.length > 0) {
//         await deleteCloudinaryImages(req.files.map(file => file.path), 'main');
//       }
//       if (req.file) {
//         await deleteCloudinaryImages([req.file.path], 'thumbnails');
//       }
//       return res.status(404).json({
//         success: false,
//         error: "Property not found",
//       });
//     }

//     // Check for duplicate name
//     if (req.body.name) {
//       const duplicateProperty = await Property.findOne({
//         name: req.body.name,
//         _id: { $ne: property._id },
//       });

//       if (duplicateProperty) {
//         // Delete uploaded images if duplicate found
//         if (req.files && req.files.length > 0) {
//           await deleteCloudinaryImages(req.files.map(file => file.path), 'main');
//         }
//         if (req.file) {
//           await deleteCloudinaryImages([req.file.path], 'thumbnails');
//         }
//         return res.status(400).json({
//           success: false,
//           error: "Property with this name already exists",
//         });
//       }
//     }

//     // Handle image updates
//     if (req.files && req.files.length > 0) {
//       // Add new images to existing ones
//       const newImageUrls = req.files.map(file => file.path);
//       req.body.iconImageUrls = [...property.iconImageUrls, ...newImageUrls];
//     }

//     // Handle thumbnail update
//     if (req.file) {
//       // Delete old thumbnail
//       if (property.iconImageThumbUrl) {
//         await deleteCloudinaryImages([property.iconImageThumbUrl], 'thumbnails');
//       }
//       req.body.iconImageThumbUrl = req.file.path;
//     }

//     // Handle image removal
//     if (req.body.removedImages) {
//       const removedImages = JSON.parse(req.body.removedImages);
//       if (removedImages.length > 0) {
//         await deleteCloudinaryImages(removedImages, 'main');
//         req.body.iconImageUrls = property.iconImageUrls.filter(
//           url => !removedImages.includes(url)
//         );
//       }
//     }

//     // Set updatedBy and updatedAt
//     req.body.updatedBy = req.user.uid;
//     req.body.updatedAt = Date.now();

//     // Parse numeric fields
//     if (req.body.price) req.body.price = parseFloat(req.body.price);
//     if (req.body.discountAmount) req.body.discountAmount = parseFloat(req.body.discountAmount);
//     if (req.body.minAdvanceBookingAmount) req.body.minAdvanceBookingAmount = parseFloat(req.body.minAdvanceBookingAmount);

//     // Update property
//     property = await Property.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     res.status(200).json({
//       success: true,
//       data: property,
//       message: "Property updated successfully",
//     });
//   } catch (error) {
//     console.error("Update property error:", error);

//     // Delete uploaded images if error occurs
//     if (req.files && req.files.length > 0) {
//       await deleteCloudinaryImages(req.files.map(file => file.path), 'main');
//     }
//     if (req.file) {
//       await deleteCloudinaryImages([req.file.path], 'thumbnails');
//     }

//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((err) => err.message);
//       return res.status(400).json({
//         success: false,
//         error: "Validation failed",
//         details: errors,
//       });
//     }

//     if (error.name === "CastError") {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid property ID format",
//       });
//     }

//     res.status(500).json({
//       success: false,
//       error: "Server error while updating property",
//     });
//   }
// };

// // @desc    Delete property and its images
// // @route   DELETE /api/properties/:id
// // @access  Private/Admin
// const deleteProperty = async (req, res) => {
//   try {
//     const property = await Property.findById(req.params.id);

//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         error: "Property not found",
//       });
//     }

//     // Delete all images from Cloudinary
//     if (property.iconImageUrls.length > 0) {
//       await deleteCloudinaryImages(property.iconImageUrls, 'main');
//     }
//     if (property.iconImageThumbUrl) {
//       await deleteCloudinaryImages([property.iconImageThumbUrl], 'thumbnails');
//     }

//     await Property.findByIdAndDelete(req.params.id);

//     res.status(200).json({
//       success: true,
//       data: {},
//       message: "Property deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete property error:", error);
//     if (error.name === "CastError") {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid property ID format",
//       });
//     }
//     res.status(500).json({
//       success: false,
//       error: "Server error while deleting property",
//     });
//   }
// };

// // @desc    Deactivate property
// // @route   PUT /api/properties/:id/deactivate
// // @access  Private/Admin
// const deactivateProperty = async (req, res) => {
//   try {
//     const property = await Property.findById(req.params.id);

//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         error: "Property not found",
//       });
//     }

//     property.isActive = false;
//     property.updatedBy = req.user.uid;
//     property.updatedAt = Date.now();
//     await property.save();

//     res.status(200).json({
//       success: true,
//       data: property,
//       message: "Property deactivated successfully",
//     });
//   } catch (error) {
//     console.error("Deactivate property error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Server error while deactivating property",
//     });
//   }
// };

// // @desc    Upload property images separately
// // @route   POST /api/properties/upload-images
// // @access  Private/Admin
// const uploadPropertyImages = async (req, res) => {
//   try {
//     const mainImages = req.files || [];
//     const thumbnail = req.file;

//     if (mainImages.length === 0 && !thumbnail) {
//       return res.status(400).json({
//         success: false,
//         error: "No image files provided",
//       });
//     }

//     const response = {
//       success: true,
//       data: {},
//       message: "Images uploaded successfully",
//     };

//     if (thumbnail) {
//       response.data.thumbnail = {
//         url: thumbnail.path,
//         publicId: thumbnail.filename,
//       };
//     }

//     if (mainImages.length > 0) {
//       response.data.mainImages = mainImages.map(file => ({
//         url: file.path,
//         publicId: file.filename,
//       }));
//     }

//     res.status(200).json(response);
//   } catch (error) {
//     console.error("Property image upload error:", error);

//     // Delete uploaded images if error occurs
//     if (req.files && req.files.length > 0) {
//       await deleteCloudinaryImages(req.files.map(file => file.path), 'main');
//     }
//     if (req.file) {
//       await deleteCloudinaryImages([req.file.path], 'thumbnails');
//     }

//     res.status(500).json({
//       success: false,
//       error: "Server error while uploading images",
//     });
//   }
// };

// module.exports = {
//   getProperties,
//   getProperty,
//   createProperty,
//   updateProperty,
//   deleteProperty,
//   deactivateProperty,
//   uploadPropertyImages,
// };