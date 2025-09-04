# Cloudinary Setup Instructions

## Required Setup for File Upload Feature

To enable file uploads with Cloudinary, you need to create an upload preset in your Cloudinary dashboard.

### Steps:

1. **Login to Cloudinary Dashboard**
   - Go to https://cloudinary.com/console
   - Login with your account credentials

2. **Create Upload Preset**
   - Navigate to Settings → Upload
   - Click "Add upload preset"
   - Set the following configuration:
     - **Preset name**: `assignment_uploads`
     - **Signing Mode**: `Unsigned`
     - **Folder**: `assignments` (optional but recommended for organization)
     - **Resource Type**: `Auto`
     - **Access Mode**: `Public`
     - **File Size Limit**: `10MB`
     - **Allowed Formats**: `pdf,png,jpg,jpeg,avif`

3. **Save the Preset**
   - Click "Save" to create the preset

### Alternative: Use Signed Uploads (More Secure)

For production environments, consider implementing signed uploads:

1. Create a backend endpoint that generates upload signatures
2. Update the `uploadToCloudinary` function to use signed uploads
3. This prevents unauthorized uploads to your Cloudinary account

### Environment Variables

Make sure these environment variables are set in your `.env` file:

```
VITE_CLOUDINARY_CLOUD_NAME=724224496477429
VITE_CLOUDINARY_API_KEY=133393639943987
VITE_CLOUDINARY_API_SECRET=NrufH498l_I55ABLVm0MW5IcnxE
```

### Testing

After setup, test the file upload feature by:

1. Navigate to any assignment submission page
2. Upload a PDF or image file
3. Verify the file appears in your Cloudinary Media Library under the `assignments` folder
4. Test OCR processing on the uploaded file

### Troubleshooting

**Upload fails with 401 Unauthorized:**
- Check that the upload preset name matches exactly: `assignment_uploads`
- Ensure the preset is set to "Unsigned" mode
- Verify your cloud name is correct

**Upload fails with 400 Bad Request:**
- Check file size (must be under 10MB)
- Verify file format is supported (PDF, PNG, JPG, JPEG, AVIF)
- Check that the preset allows the file type

**Files not appearing in correct folder:**
- Verify the folder setting in your upload preset
- Check that the folder name in the code matches the preset configuration
