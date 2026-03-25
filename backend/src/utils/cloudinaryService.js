const { cloudinary } = require("../config/cloudinary");

/**
 * Delete file from Cloudinary using public_id or URL
 * @param {string} identifier - Public ID or Cloudinary URL
 * @returns {Promise}
 */
async function deleteFileFromCloudinary(identifier) {
  try {
    if (!identifier) return;

    // Extract public_id from URL if URL is provided
    let publicId;
    if (identifier.includes("/")) {
      // Extract public_id from Cloudinary URL
      // Format: https://res.cloudinary.com/cloud/image/upload/v123/agro-wallet/bills/filename
      const parts = identifier.split("/");
      const lastPart = parts[parts.length - 1];
      const filenameWithoutExtension = lastPart.split(".")[0];
      publicId = `agro-wallet/bills/${filenameWithoutExtension}`;
    } else {
      publicId = identifier;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    // Don't throw error, just log it
  }
}

/**
 * Upload file to Cloudinary (manual upload if needed)
 * @param {string} filePath - Local file path or URL to upload
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise}
 */
async function uploadFileToCloudinary(filePath, folder = "agro-wallet/bills") {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    throw error;
  }
}

/**
 * Get optimized Cloudinary URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options
 * @returns {string}
 */
function getOptimizedImageUrl(publicId, options = {}) {
  const defaultOptions = {
    quality: "auto",
    fetch_format: "auto",
    width: 800,
    crop: "fill",
    ...options,
  };

  return cloudinary.url(publicId, defaultOptions);
}

module.exports = {
  deleteFileFromCloudinary,
  uploadFileToCloudinary,
  getOptimizedImageUrl,
};
