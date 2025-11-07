const { cloudinary } = require('../config/cloudinary');

const generateImageUrls = (publicId) => {
  const mainImageUrl = cloudinary.url(publicId, {
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto' }
    ]
  });

  const thumbnailUrl = cloudinary.url(publicId, {
    transformation: [
      { width: 200, height: 200, crop: 'thumb', quality: 'auto' }
    ]
  });

  return {
    mainImageUrl,
    thumbnailUrl
  };
};

module.exports = {
  generateImageUrls
};