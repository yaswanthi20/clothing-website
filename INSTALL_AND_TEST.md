# Installation and Testing Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

This installs multer and all other required packages.

### 2. Verify Installation
```bash
npm list multer
```

Should show: `multer@1.4.5-lts.1`

### 3. Start Server
```bash
npm run dev
```

Server should start on http://localhost:3000

---

## ✅ Test the Image Upload System

### Test 1: Upload Single Image
1. Open http://localhost:3000
2. Login as admin: `admin@example.com` / `admin123`
3. Go to Admin Panel → Products
4. Click "Add Product"
5. Fill in:
   - Name: "Test Product"
   - Category: Select any
   - Price: 999
6. Click "Choose Files" in Product Images section
7. Select 1 JPG image from your computer
8. Click "📤 Upload Images"
9. Wait for green success message
10. Click "Save Product"

**Expected Result:**
- ✅ Upload progress bar shows 100%
- ✅ Image appears in list with filename and size
- ✅ Product saved successfully
- ✅ Image displays on shop page

### Test 2: Upload Multiple Images
1. Click "Add Product" again
2. Fill in product details
3. Select 3-5 images
4. Click "📤 Upload Images"
5. Save product

**Expected Result:**
- ✅ All images upload with progress tracking
- ✅ All images appear in list
- ✅ All images saved to database

### Test 3: File Validation
Try uploading:
- [ ] Image > 2MB (should fail with error)
- [ ] .gif file (should fail with error)
- [ ] .pdf file (should fail with error)
- [ ] More than 5 images (should fail with error)

**Expected Result:**
- ✅ Clear error messages for each case
- ✅ No files uploaded on validation failure

### Test 4: Edit Product
1. Click "Edit" on existing product
2. Existing images should load
3. Upload additional images
4. Remove one image
5. Save product

**Expected Result:**
- ✅ Existing images displayed
- ✅ New images added
- ✅ Removed images deleted
- ✅ All changes saved

### Test 5: Verify File System
Check folder structure:
```bash
dir public\images\products
```

**Expected Result:**
```
products/
├── 1/
│   └── 1_1708123456789_123456.jpg
├── 2/
│   └── 2_1708123457890_654321.jpg
└── temp/
```

### Test 6: Verify Database
Check database records:
```sql
SELECT * FROM product_images;
```

**Expected Result:**
```
id | product_id | image_url
1  | 1          | /images/products/1/1_1708123456789_123456.jpg
2  | 2          | /images/products/2/2_1708123457890_654321.jpg
```

### Test 7: Display on Shop Page
1. Go to http://localhost:3000/shop.html
2. Find uploaded products
3. Click on product

**Expected Result:**
- ✅ Product images display correctly
- ✅ Image carousel works (if multiple images)
- ✅ No broken image links

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'multer'"
**Solution:**
```bash
npm install
```

### Issue: "ENOENT: no such file or directory"
**Solution:**
```bash
mkdir public\images\products
```

### Issue: Images not uploading
**Check:**
1. Are you logged in as admin?
2. Is file size < 2MB?
3. Is file type JPG/PNG/WEBP?
4. Check browser console for errors
5. Check server logs

### Issue: Images not displaying
**Check:**
1. Verify image path in database
2. Check if file exists in folder
3. Check browser console for 404 errors
4. Verify Express static middleware

---

## 📊 Success Criteria

All tests should pass:
- [x] Dependencies installed
- [ ] Single image upload works
- [ ] Multiple image upload works
- [ ] File validation works
- [ ] Edit product works
- [ ] Files saved to correct folders
- [ ] Database records correct
- [ ] Images display on shop page

---

## 🎉 Ready to Use!

Once all tests pass, the image upload system is ready for production use.

---

## 📚 Documentation

- **IMAGE_UPLOAD_GUIDE.md** - Complete technical guide
- **ADMIN_IMAGE_UPLOAD_QUICK_GUIDE.md** - Quick reference for admins
- **SETUP_IMAGE_UPLOAD.md** - Setup instructions
- **PHASE5_IMAGE_UPLOAD_SUMMARY.md** - Implementation summary

---

## 🆘 Support

If you encounter issues:
1. Check this guide
2. Review IMAGE_UPLOAD_GUIDE.md
3. Check server logs
4. Verify file permissions
5. Test with different images

---

**Last Updated**: February 2024
