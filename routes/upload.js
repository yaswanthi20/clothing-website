import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Middleware to check admin authentication
const requireAdmin = (req, res, next) => {
    if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Sanitize filename to prevent directory traversal
const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

// Configure multer for file upload with product-specific folders
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const productId = req.body.productId || 'temp';
        const uploadPath = path.join(__dirname, '../public/images/products', productId.toString());
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Sanitize original filename
        const ext = path.extname(file.originalname).toLowerCase();
        const productId = req.body.productId || 'temp';
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E6);
        
        // Format: productId_timestamp_random.ext
        const filename = `${productId}_${timestamp}_${randomSuffix}${ext}`;
        cb(null, filename);
    }
});

// File filter - only allow specific image types
const fileFilter = (req, file, cb) => {
    // Allowed extensions
    const allowedExtensions = /jpeg|jpg|png|webp/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    
    // Allowed MIME types (server-side validation)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit per file
        files: 5 // Maximum 5 files at once
    },
    fileFilter: fileFilter
});

// Upload single image for a product
router.post('/product-image', requireAdmin, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const productId = req.body.productId || 'temp';
        const imageUrl = `/images/products/${productId}/${req.file.filename}`;
        
        res.json({
            success: true,
            imageUrl: imageUrl,
            filename: req.file.filename,
            size: req.file.size,
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload multiple images for a product
router.post('/product-images', requireAdmin, upload.array('images', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        const productId = req.body.productId || 'temp';
        
        const imageUrls = req.files.map(file => ({
            url: `/images/products/${productId}/${file.filename}`,
            filename: file.filename,
            size: file.size
        }));
        
        res.json({
            success: true,
            images: imageUrls,
            count: req.files.length,
            message: `${req.files.length} image(s) uploaded successfully`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product image
router.delete('/product-image', requireAdmin, (req, res) => {
    try {
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }
        
        // Extract file path from URL
        const filePath = path.join(__dirname, '../public', imageUrl);
        
        // Security check: ensure path is within public/images/products
        const normalizedPath = path.normalize(filePath);
        const allowedDir = path.join(__dirname, '../public/images/products');
        
        if (!normalizedPath.startsWith(allowedDir)) {
            return res.status(403).json({ error: 'Invalid file path' });
        }
        
        // Delete file if exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Image deleted successfully' });
        } else {
            res.status(404).json({ error: 'Image file not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum 2MB per image allowed.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum 5 images allowed.' });
        }
        return res.status(400).json({ error: error.message });
    }
    
    if (error.message) {
        return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Upload failed' });
});

export default router;
