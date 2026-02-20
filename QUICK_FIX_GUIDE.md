# Quick Fix Guide - Image Upload Not Working

## Problem
- Images not showing in customer page
- Image links not stored in database

## Solution Steps

### Step 1: Verify Setup (30 seconds)
```bash
# Check multer is installed
npm list multer

# Check folders exist
dir public\images\products
dir public\images\products\temp
```

### Step 2: Test Upload Endpoint (2 minutes)
1. Start server: `npm run dev`
2. Login as admin: http://localhost:3000/login.html
   - Email: admin@example.com
   - Password: admin123
3. Go to: http://localhost:3000/test-upload.html
4. Select an image file
5. Click "Upload to Temp Folder"
6. Check result

**Expected:** Green success message with image URL

**If it fails:** Check server console for errors

### Step 3: Test Full Product Creation (3 minutes)
1. Go to: http://localhost:3000/admin/products.html
2. Click "Add Product"
3. Fill in:
   - Name: Test Image Upload
   - Category: Select any
   - Price: 999
   - Stock S: 10
4. Click "Choose Files" → Select 1 image
5. Click "📤 Upload Images"
6. Wait for green success message
7. Click "Save Product"

**Watch server console** - you should see detailed logs about:
- Creating product
- Processing images
- Migrating from temp folder
- Saving to database

### Step 4: Verify (1 minute)
```bash
# Check database
node database/check-product-images.js
```

Look for your new product - should have image_count = 1

### Step 5: Check Shop Page (30 seconds)
Go to: http://localhost:3000/shop.html

Find your product - image should display

---

## If It Still Doesn't Work

### Check 1: Server Console
Look for errors when saving product. Common issues:
- Database connection error
- File permission error
- Path not found error

### Check 2: Browser Console (F12)
Look for errors when uploading. Common issues:
- 403 Forbidden (not logged in as admin)
- 404 Not Found (route not registered)
- 400 Bad Request (validation failed)

### Check 3: File System
```bash
# After uploading, check if file exists
dir public\images\products\temp

# After saving product, check if file moved
dir public\images\products\13
```

### Check 4: Database
```bash
node database/check-product-images.js
```

If image_count is still 0, the database insert failed.

---

## Quick Fixes

### Fix 1: Restart Server
Sometimes the route doesn't register properly:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Fix 2: Clear Browser Cache
Hard refresh: Ctrl+Shift+R

### Fix 3: Check Admin Login
Make sure you're logged in as admin, not customer.

### Fix 4: Try Different Image
Use a small JPG file (< 500KB) to test.

---

## Expected Behavior

### When Uploading:
1. File selected
2. Click "Upload Images"
3. Progress bar shows 0% → 100%
4. Green success message
5. Image appears in list with filename and size

### When Saving Product:
1. Click "Save Product"
2. Server console shows:
   ```
   Creating product: Test Image Upload
   Processing images: [...]
   ✓ Moved image to: /images/products/13/13_...jpg
   ✓ Image saved to database
   ```
3. Success message: "Product created successfully"

### On Shop Page:
1. Product appears in grid
2. Image displays (not broken)
3. Click product → image shows in detail page

---

## Still Having Issues?

Run the full debug process:
```bash
# See DEBUG_IMAGE_UPLOAD.md for detailed debugging
```

Or share:
1. Server console output when saving product
2. Browser console output when uploading
3. Result of: `node database/check-product-images.js`
4. Result of: `dir public\images\products\temp`
