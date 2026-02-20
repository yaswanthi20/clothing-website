# Product Image Upload System Guide

## Overview
Secure and scalable image upload system for the Women's Fashion E-commerce Admin Panel.

## Features
✅ File upload from admin panel (no URL entry needed)  
✅ Multiple image upload support (up to 5 images)  
✅ Organized folder structure by product ID  
✅ Server-side validation and security  
✅ Progress indicator with visual feedback  
✅ Image preview and management  
✅ Ready for cloud storage migration  

---

## File Storage Structure

Images are stored in organized folders:

```
/public/images/products/{product-id}/
```

### Examples:
```
/public/images/products/12/12_1708123456789_123456.jpg
/public/images/products/12/12_1708123457890_654321.jpg
/public/images/products/15/15_1708123458901_789012.png
```

### Naming Convention:
```
{productId}_{timestamp}_{random}.{ext}
```

This ensures:
- No file overwrites
- Easy identification
- Unique filenames
- Organized by product

---

## Supported File Types

| Format | Extension | MIME Type |
|--------|-----------|-----------|
| JPEG   | .jpg      | image/jpeg |
| JPEG   | .jpeg     | image/jpeg |
| PNG    | .png      | image/png |
| WebP   | .webp     | image/webp |

---

## File Validation Rules

### Size Limits:
- **Per Image**: 2MB maximum
- **Total Upload**: 5 images maximum per upload

### Security Validations:
✅ File type validation (server-side)  
✅ File size validation  
✅ MIME type verification  
✅ Filename sanitization  
✅ Directory traversal prevention  
✅ Upload path restriction  

---

## How to Upload Images (Admin Panel)

### Step 1: Add/Edit Product
1. Go to Admin Panel → Products
2. Click "Add Product" or "Edit" existing product

### Step 2: Upload Images
1. Click "Choose Files" in the Product Images section
2. Select 1-5 images (JPG, JPEG, PNG, or WEBP)
3. Click "📤 Upload Images" button
4. Wait for upload progress to complete

### Step 3: Review & Save
1. Uploaded images appear in the list below
2. You can remove unwanted images
3. Click "Save Product" to finalize

---

## Database Storage

Images are **NOT** stored in the database as binary data.

Only the **image path** is stored:

### Product_Images Table:
```sql
CREATE TABLE product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

### Example Record:
```json
{
  "id": 45,
  "product_id": 12,
  "image_url": "/images/products/12/12_1708123456789_123456.jpg",
  "created_at": "2024-02-16 10:30:45"
}
```

---

## API Endpoints

### 1. Upload Single Image
```
POST /api/upload/product-image
```

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `image`: File (required)
  - `productId`: Number (required)

**Response:**
```json
{
  "success": true,
  "imageUrl": "/images/products/12/12_1708123456789_123456.jpg",
  "filename": "12_1708123456789_123456.jpg",
  "size": 245678,
  "message": "Image uploaded successfully"
}
```

### 2. Upload Multiple Images
```
POST /api/upload/product-images
```

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `images[]`: Files (required, max 5)
  - `productId`: Number (required)

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "url": "/images/products/12/12_1708123456789_123456.jpg",
      "filename": "12_1708123456789_123456.jpg",
      "size": 245678
    }
  ],
  "count": 1,
  "message": "1 image(s) uploaded successfully"
}
```

### 3. Delete Image
```
DELETE /api/upload/product-image
```

**Request:**
```json
{
  "imageUrl": "/images/products/12/12_1708123456789_123456.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## Error Handling

### Common Errors:

| Error | Cause | Solution |
|-------|-------|----------|
| "No file uploaded" | No file selected | Select at least one image |
| "File size too large" | Image > 2MB | Compress or resize image |
| "Only JPG, JPEG, PNG, and WEBP allowed" | Wrong file type | Use supported format |
| "Too many files" | More than 5 images | Upload in batches |
| "Admin access required" | Not logged in as admin | Login with admin account |

---

## Security Features

### 1. Authentication
- Only admin users can upload images
- Session-based authentication required

### 2. File Validation
- Server-side MIME type checking
- Extension validation
- File size limits enforced

### 3. Path Security
- Filename sanitization
- Directory traversal prevention
- Upload path restriction to `/public/images/products/`

### 4. Storage Security
- Unique filenames prevent overwrites
- Organized folder structure
- Automatic folder creation with proper permissions

---

## Future: Cloud Storage Migration

The system is designed for easy migration to cloud storage (AWS S3, Cloudinary, etc.)

### Current Architecture:
```
Admin Upload → Local Storage → Database (path only)
```

### Future Architecture:
```
Admin Upload → Cloud Storage → Database (cloud URL)
```

### Migration Steps:
1. Update `routes/upload.js` storage configuration
2. Replace local storage with cloud SDK
3. Update image URLs in database
4. No changes needed in frontend!

### Example Cloud URL:
```
https://your-bucket.s3.amazonaws.com/products/12/12_1708123456789_123456.jpg
```

---

## Testing Checklist

### Upload Tests:
- [ ] Upload single image
- [ ] Upload multiple images (2-5)
- [ ] Upload JPG image
- [ ] Upload PNG image
- [ ] Upload WEBP image
- [ ] Try uploading > 2MB image (should fail)
- [ ] Try uploading > 5 images (should fail)
- [ ] Try uploading .gif or .bmp (should fail)

### Display Tests:
- [ ] Images display on product page
- [ ] Images display in shop grid
- [ ] Images display in admin panel
- [ ] Image carousel works correctly

### Management Tests:
- [ ] Remove image from list
- [ ] Edit product and add more images
- [ ] Delete product (images should be removed)
- [ ] Check database for correct paths

### Security Tests:
- [ ] Non-admin cannot upload
- [ ] Cannot upload to parent directories
- [ ] Cannot overwrite existing files
- [ ] File type validation works

---

## Troubleshooting

### Images not uploading?
1. Check if multer is installed: `npm install`
2. Verify admin authentication
3. Check file size and type
4. Check server logs for errors

### Images not displaying?
1. Verify image path in database
2. Check if file exists in `/public/images/products/{id}/`
3. Verify Express static middleware is configured
4. Check browser console for 404 errors

### Upload folder not created?
1. Check folder permissions
2. Verify server has write access
3. Check if path exists: `/public/images/products/`

---

## Technical Details

### Dependencies:
```json
{
  "multer": "^1.4.5-lts.1"
}
```

### Files Modified:
- `routes/upload.js` - Upload logic
- `routes/admin.js` - Product creation with image migration
- `public/admin/products.html` - File upload UI
- `public/js/admin/products.js` - Upload handling
- `server.js` - Route registration

### Folder Structure:
```
project/
├── public/
│   └── images/
│       └── products/
│           ├── 1/
│           ├── 2/
│           └── temp/  (for new products)
├── routes/
│   ├── upload.js
│   └── admin.js
└── server.js
```

---

## Support

For issues or questions:
1. Check this guide
2. Review server logs
3. Check browser console
4. Verify file permissions
5. Test with different image files

---

**Last Updated**: February 2024  
**Version**: 1.0.0
