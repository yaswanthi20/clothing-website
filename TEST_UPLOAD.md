# Test Upload System

## Step-by-Step Test

### 1. Start the server
```bash
npm run dev
```

### 2. Open browser console (F12)
Go to: http://localhost:3000/admin/products.html

### 3. Login as admin
- Email: admin@example.com
- Password: admin123

### 4. Click "Add Product"

### 5. Fill in the form:
- Name: Test Product Upload
- Category: Select any
- Price: 999
- Stock S: 10

### 6. Upload an image:
- Click "Choose Files"
- Select 1 image (JPG, PNG, or WEBP)
- Click "📤 Upload Images"

### 7. Watch the browser console
You should see:
```
Uploading 1 of 1: yourimage.jpg
```

### 8. Check the response
After upload completes, you should see the image in the list with:
- Filename
- URL path
- File size

### 9. Click "Save Product"

### 10. Check server console
You should see detailed logs:
```
Creating product: Test Product Upload
Images received: [{ url: '/images/products/temp/temp_...jpg', filename: '...', size: ... }]
Processing images: ...
Processing image URL: /images/products/temp/temp_...jpg
Image is in temp folder, migrating...
Old path: C:\...\public\images\products\temp\temp_...jpg
File exists? true
Created folder: C:\...\public\images\products\13
New path: C:\...\public\images\products\13\13_...jpg
✓ Moved image to: /images/products/13/13_...jpg
Saving to database: /images/products/13/13_...jpg
✓ Image saved to database
```

### 11. Verify in database
```bash
node database/check-product-images.js
```

Should show the new product with image_count = 1

### 12. Check file system
```bash
dir public\images\products\13
```

Should show the image file

### 13. Check on shop page
Go to: http://localhost:3000/shop.html
Find your product - image should display

---

## If it doesn't work:

### Check 1: Is multer installed?
```bash
npm list multer
```

### Check 2: Does temp folder exist?
```bash
dir public\images\products\temp
```

If not, create it:
```bash
mkdir public\images\products\temp
```

### Check 3: Check browser console for errors

### Check 4: Check server console for errors

### Check 5: Try uploading again and watch both consoles
