# Image Upload System Setup

## Quick Setup Steps

### 1. Install Dependencies
```bash
npm install
```

This will install multer (already added to package.json).

### 2. Create Images Folder Structure
The folders will be created automatically when you upload images, but you can create them manually:

```bash
mkdir -p public/images/products
```

On Windows:
```cmd
mkdir public\images\products
```

### 3. Start Server
```bash
npm run dev
```

### 4. Test Upload
1. Login as admin: `admin@example.com` / `admin123`
2. Go to Admin Panel → Products
3. Click "Add Product"
4. Fill in product details
5. Click "Choose Files" and select images
6. Click "📤 Upload Images"
7. Save product

---

## Verification

### Check if multer is installed:
```bash
npm list multer
```

Should show: `multer@1.4.5-lts.1`

### Check folder structure:
```
public/
└── images/
    └── products/
        ├── 1/
        ├── 2/
        └── temp/
```

### Check database:
```sql
SELECT * FROM product_images;
```

Should show image URLs like: `/images/products/12/12_1708123456789_123456.jpg`

---

## What Changed

### New Files:
- `IMAGE_UPLOAD_GUIDE.md` - Complete documentation
- `SETUP_IMAGE_UPLOAD.md` - This file

### Modified Files:
- `routes/upload.js` - Secure upload with product folders
- `routes/admin.js` - Temp folder migration on product creation
- `public/admin/products.html` - File upload UI
- `public/js/admin/products.js` - Upload handling with progress
- `server.js` - Added upload route

### Features Added:
✅ File upload (no URL entry)  
✅ Multiple images (up to 5)  
✅ Progress indicator  
✅ 2MB per image limit  
✅ JPG, JPEG, PNG, WEBP support  
✅ Organized by product ID  
✅ Server-side validation  
✅ Security features  

---

## Ready to Use!

Run `npm install` and start uploading images from the admin panel.
