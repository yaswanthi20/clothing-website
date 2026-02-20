# Debug Image Upload Issues

## Current Status
- Products 8-12 have NO images in database
- Upload system is implemented
- Need to verify it's working

## Debugging Steps

### Step 1: Verify Server Setup
```bash
# Check multer is installed
npm list multer
# Should show: multer@1.4.5-lts.2

# Check folders exist
dir public\images\products
dir public\images\products\temp
```

### Step 2: Check Current Database State
```bash
node database/check-product-images.js
```

### Step 3: Test Upload Endpoint Directly

Create a test file `test-upload.html` in public folder:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Upload</title>
</head>
<body>
    <h1>Test Image Upload</h1>
    <input type="file" id="fileInput" accept="image/*">
    <button onclick="testUpload()">Upload</button>
    <div id="result"></div>

    <script>
        async function testUpload() {
            const file = document.getElementById('fileInput').files[0];
            if (!file) {
                alert('Select a file first');
                return;
            }

            const formData = new FormData();
            formData.append('image', file);
            formData.append('productId', 'temp');

            try {
                const response = await fetch('/api/upload/product-image', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                document.getElementById('result').innerHTML = 
                    '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
                
                console.log('Upload result:', result);
            } catch (error) {
                console.error('Upload error:', error);
                document.getElementById('result').innerHTML = 
                    '<p style="color: red;">Error: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
```

### Step 4: Test the Upload
1. Start server: `npm run dev`
2. Login as admin
3. Go to: http://localhost:3000/test-upload.html
4. Select an image
5. Click Upload
6. Check result

**Expected Result:**
```json
{
  "success": true,
  "imageUrl": "/images/products/temp/temp_1708123456789_123456.jpg",
  "filename": "temp_1708123456789_123456.jpg",
  "size": 245678,
  "message": "Image uploaded successfully"
}
```

### Step 5: Check File Was Created
```bash
dir public\images\products\temp
```

Should show the uploaded file.

### Step 6: Test Full Product Creation

1. Go to Admin Panel → Products
2. Click "Add Product"
3. Fill in details:
   - Name: Debug Test Product
   - Category: Any
   - Price: 999
   - Stock S: 10
4. Upload image
5. Save product

**Watch server console for:**
```
Creating product: Debug Test Product
Images received: [...]
Processing images: [...]
Processing image URL: /images/products/temp/temp_...jpg
Image is in temp folder, migrating...
Old path: ...
File exists? true
✓ Moved image to: /images/products/13/13_...jpg
✓ Image saved to database
```

### Step 7: Verify Database
```bash
node database/check-product-images.js
```

Should show new product with image_count = 1

### Step 8: Check Shop Page
Go to: http://localhost:3000/shop.html

Find your product - image should display.

---

## Common Issues & Solutions

### Issue 1: "Admin access required"
**Cause:** Not logged in as admin
**Solution:** Login with admin@example.com / admin123

### Issue 2: Upload returns 404
**Cause:** Upload route not registered
**Solution:** Check server.js has `app.use('/api/upload', uploadRoutes);`

### Issue 3: File not found during migration
**Cause:** File uploaded to wrong location
**Solution:** 
- Check upload.js destination path
- Verify temp folder exists
- Check file permissions

### Issue 4: Images not in database
**Cause:** Transaction rollback or error during save
**Solution:**
- Check server console for errors
- Verify database connection
- Check product_images table structure

### Issue 5: Images not displaying on shop
**Cause:** Wrong image path or file doesn't exist
**Solution:**
- Check image_url in database
- Verify file exists at that path
- Check Express static middleware

---

## Manual Fix for Existing Products

If products 8-12 need images, you can:

### Option 1: Delete and recreate
```sql
DELETE FROM products WHERE id IN (8, 9, 10, 11, 12);
```
Then create new products with images.

### Option 2: Edit and add images
1. Go to Admin Panel → Products
2. Click "Edit" on product 8
3. Upload images
4. Save

---

## Verification Checklist

- [ ] Multer installed
- [ ] Temp folder exists
- [ ] Upload endpoint responds
- [ ] Files saved to temp folder
- [ ] Product creation works
- [ ] Files migrated to product folder
- [ ] Database records created
- [ ] Images display on shop page

---

## Next Steps

1. Run through all debugging steps
2. Note where it fails
3. Check server console for errors
4. Check browser console for errors
5. Verify file permissions
6. Test with different image files
