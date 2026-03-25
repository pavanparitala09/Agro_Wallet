# Cloudinary Integration Setup Guide

## Environment Variables

Add the following environment variables to your `.env` file in the backend folder:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How to Get Cloudinary Credentials

1. **Sign up for Cloudinary** (free tier available):
   - Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
   - Create a free account

2. **Find your credentials on the Dashboard**:
   - Log in to [https://cloudinary.com/console](https://cloudinary.com/console)
   - On the "Dashboard" or "Settings" tab, you'll see:
     - **Cloud Name**: Your unique Cloudinary cloud identifier
     - **API Key**: Your public API key
     - **API Secret**: Your secret key (keep this confidential!)

3. **Copy the credentials to `.env`**:
   ```env
   CLOUDINARY_CLOUD_NAME=dcxxxxxyz
   CLOUDINARY_API_KEY=123456789
   CLOUDINARY_API_SECRET=abc123xyz789
   ```

## Project Integration

The Cloudinary integration has been added to your backend with the following features:

### Files Added:

1. **`src/config/cloudinary.js`** - Cloudinary configuration and multer setup
2. **`src/utils/cloudinaryService.js`** - Utility functions for file operations

### Files Modified:

1. **`src/routes/billRoutes.js`** - Updated to use Cloudinary upload middleware
2. **`src/controllers/billController.js`** - Updated to:
   - Store Cloudinary URLs instead of local file paths
   - Delete old images from Cloudinary when updating bills
   - Delete images from Cloudinary when bills are deleted
3. **`server.js`** - Removed local `/uploads` folder configuration
4. **`package.json`** - Added `cloudinary` and `multer-storage-cloudinary` dependencies

### Features:

- ✅ Automatic image upload to Cloudinary
- ✅ Automatic cleanup when files are updated or deleted
- ✅ Support for images (JPG, PNG, GIF, WebP) and PDFs
- ✅ 5MB file size limit
- ✅ Organized file structure in Cloudinary (`agro-wallet/bills` folder)
- ✅ Automatic quality optimization

### API Usage:

Your existing API endpoints work the same way:

- `POST /bills` - Upload bill with image
- `PUT /bills/:id` - Update bill and image
- `DELETE /bills/:id` - Delete bill and its image from Cloudinary

### Cloudinary Service Functions:

All utility functions in `cloudinaryService.js` are available for additional use:

- `deleteFileFromCloudinary(identifier)` - Delete a file by URL or public ID
- `uploadFileToCloudinary(filePath, folder)` - Manual upload of a file
- `getOptimizedImageUrl(publicId, options)` - Get optimized URL with transformations

## Testing

1. Ensure your `.env` file has the Cloudinary credentials
2. Start your backend: `npm run dev`
3. Upload a bill with an image - the image will be stored in Cloudinary
4. Check your Cloudinary dashboard - files will appear in the `agro-wallet/bills` folder
