import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// Middleware to check admin authentication
const requireAdmin = (req, res, next) => {
    if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Dashboard statistics
router.get('/dashboard/stats', requireAdmin, async (req, res) => {
    try {
        const [productCount] = await db.query('SELECT COUNT(*) as count FROM products');
        const [orderCount] = await db.query('SELECT COUNT(*) as count FROM orders');
        const [revenue] = await db.query(
            'SELECT SUM(total_amount) as total FROM orders WHERE payment_status = "Paid"'
        );
        const [pendingOrders] = await db.query(
            'SELECT COUNT(*) as count FROM orders WHERE order_status = "Processing"'
        );
        const [lowStock] = await db.query(
            'SELECT COUNT(*) as count FROM product_variants WHERE stock_quantity < 5 AND stock_quantity > 0'
        );
        const [recentOrders] = await db.query(`
            SELECT o.id, o.total_amount, o.payment_status, o.order_status, o.created_at,
                   u.name as customer_name, u.email
            FROM orders o
            JOIN users u ON u.id = o.user_id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);
        
        res.json({
            totalProducts: productCount[0].count,
            totalOrders: orderCount[0].count,
            totalRevenue: revenue[0].total || 0,
            pendingOrders: pendingOrders[0].count,
            lowStockItems: lowStock[0].count,
            recentOrders
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== CATEGORY MANAGEMENT =====

// Get all categories
router.get('/categories', requireAdmin, async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT c.*, COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            GROUP BY c.id
            ORDER BY c.name
        `);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create category
router.post('/categories', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        // Check for duplicate
        const [existing] = await db.query('SELECT id FROM categories WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Category already exists' });
        }
        
        const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
        res.json({ success: true, id: result.insertId, message: 'Category created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update category
router.put('/categories/:id', requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        // Check for duplicate (excluding current category)
        const [existing] = await db.query(
            'SELECT id FROM categories WHERE name = ? AND id != ?',
            [name, req.params.id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        
        await db.query('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
        res.json({ success: true, message: 'Category updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete category
router.delete('/categories/:id', requireAdmin, async (req, res) => {
    try {
        // Check if category has products
        const [products] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [req.params.id]
        );
        
        if (products[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete category with existing products',
                productCount: products[0].count
            });
        }
        
        await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== PRODUCT MANAGEMENT =====

// Get all products (admin view)
router.get('/products', requireAdmin, async (req, res) => {
    try {
        const { search, category, status } = req.query;
        
        let query = `
            SELECT p.*, c.name as category_name,
                   (SELECT SUM(stock_quantity) FROM product_variants WHERE product_id = p.id) as total_stock,
                   (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as image_count
            FROM products p
            JOIN categories c ON c.id = p.category_id
            WHERE 1=1
        `;
        const params = [];
        
        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (category) {
            query += ' AND p.category_id = ?';
            params.push(category);
        }
        
        query += ' ORDER BY p.created_at DESC';
        
        const [products] = await db.query(query, params);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product (admin view)
router.get('/products/:id', requireAdmin, async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const [variants] = await db.query(
            'SELECT * FROM product_variants WHERE product_id = ? ORDER BY FIELD(size, "S", "M", "L", "XL")',
            [req.params.id]
        );
        
        const [images] = await db.query(
            'SELECT * FROM product_images WHERE product_id = ?',
            [req.params.id]
        );
        
        res.json({ ...products[0], variants, images });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product
router.post('/products', requireAdmin, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { name, description, price, discount_price, category_id, fabric, care_instructions, variants, images } = req.body;
        
        console.log('Creating product:', name);
        console.log('Images received:', images);
        
        // Validation
        if (!name || !price || !category_id) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }
        
        // Create product
        const [result] = await connection.query(
            `INSERT INTO products (name, description, price, discount_price, category_id, fabric, care_instructions)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description, price, discount_price || null, category_id, fabric, care_instructions]
        );
        
        const productId = result.insertId;
        console.log('Product created with ID:', productId);
        
        // Add variants
        if (variants && Array.isArray(variants)) {
            for (const variant of variants) {
                await connection.query(
                    'INSERT INTO product_variants (product_id, size, stock_quantity) VALUES (?, ?, ?)',
                    [productId, variant.size, variant.stock_quantity || 0]
                );
            }
            console.log('Variants added:', variants.length);
        }
        
        // Handle images - migrate from temp folder if needed
        if (images && Array.isArray(images) && images.length > 0) {
            console.log('Processing images:', images);
            console.log('Number of images:', images.length);
            
            const fs = await import('fs');
            const path = await import('path');
            const { fileURLToPath } = await import('url');
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            
            for (const image of images) {
                let imageUrl = image.url || image.image_url;
                console.log('Processing image URL:', imageUrl);
                
                // If image is in temp folder, move it to product folder
                if (imageUrl && imageUrl.includes('/temp/')) {
                    console.log('Image is in temp folder, migrating...');
                    
                    // Convert URL path to file system path
                    const urlPath = imageUrl.replace(/^\//, ''); // Remove leading slash
                    const oldPath = path.join(__dirname, '../public', urlPath);
                    console.log('Old path:', oldPath);
                    console.log('File exists?', fs.existsSync(oldPath));
                    
                    if (!fs.existsSync(oldPath)) {
                        console.log('✗ File not found at expected location');
                        console.log('  Saving original URL to database');
                        // Save original URL even if file not found
                        await connection.query(
                            'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
                            [productId, imageUrl]
                        );
                        continue;
                    }
                    
                    const filename = path.basename(imageUrl);
                    const newFolder = path.join(__dirname, '../public/images/products', productId.toString());
                    
                    // Create product folder
                    if (!fs.existsSync(newFolder)) {
                        fs.mkdirSync(newFolder, { recursive: true });
                        console.log('Created folder:', newFolder);
                    }
                    
                    // New filename with product ID
                    const newFilename = filename.replace(/^temp_/, `${productId}_`);
                    const newPath = path.join(newFolder, newFilename);
                    console.log('New path:', newPath);
                    
                    // Move file
                    try {
                        fs.renameSync(oldPath, newPath);
                        imageUrl = `/images/products/${productId}/${newFilename}`;
                        console.log('✓ Moved image to:', imageUrl);
                    } catch (error) {
                        console.log('✗ Error moving file:', error.message);
                        console.log('  Keeping original URL');
                    }
                } else {
                    console.log('Image not in temp folder, using as-is');
                }
                
                if (imageUrl) {
                    console.log('Saving to database:', imageUrl);
                    await connection.query(
                        'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
                        [productId, imageUrl]
                    );
                    console.log('✓ Image saved to database');
                } else {
                    console.log('✗ No image URL to save');
                }
            }
            console.log('All images processed successfully');
        } else {
            console.log('⚠️ No images provided or images array is empty');
        }
        
        await connection.commit();
        res.json({ success: true, id: productId, message: 'Product created successfully' });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Update product
router.put('/products/:id', requireAdmin, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { name, description, price, discount_price, category_id, fabric, care_instructions, images, variants } = req.body;
        
        if (!name || !price || !category_id) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }
        
        // Update product
        await connection.query(
            `UPDATE products 
             SET name = ?, description = ?, price = ?, discount_price = ?, 
                 category_id = ?, fabric = ?, care_instructions = ?
             WHERE id = ?`,
            [name, description, price, discount_price || null, category_id, fabric, care_instructions, req.params.id]
        );
        
        // Update variants if provided
        if (variants && Array.isArray(variants)) {
            for (const variant of variants) {
                // Check if variant exists
                const [existing] = await connection.query(
                    'SELECT id FROM product_variants WHERE product_id = ? AND size = ?',
                    [req.params.id, variant.size]
                );
                
                if (existing.length > 0) {
                    // Update existing
                    await connection.query(
                        'UPDATE product_variants SET stock_quantity = ? WHERE product_id = ? AND size = ?',
                        [variant.stock_quantity || 0, req.params.id, variant.size]
                    );
                } else {
                    // Insert new
                    await connection.query(
                        'INSERT INTO product_variants (product_id, size, stock_quantity) VALUES (?, ?, ?)',
                        [req.params.id, variant.size, variant.stock_quantity || 0]
                    );
                }
            }
        }
        
        // Update images if provided
        if (images && Array.isArray(images)) {
            // Delete old images
            await connection.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
            
            // Add new images
            for (const image of images) {
                const imageUrl = image.url || image.image_url;
                if (imageUrl) {
                    await connection.query(
                        'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
                        [req.params.id, imageUrl]
                    );
                }
            }
        }
        
        await connection.commit();
        res.json({ success: true, message: 'Product updated successfully' });
        
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Update product stock
router.put('/products/:id/stock', requireAdmin, async (req, res) => {
    try {
        const { variants } = req.body;
        
        if (!variants || !Array.isArray(variants)) {
            return res.status(400).json({ error: 'Variants array is required' });
        }
        
        for (const variant of variants) {
            if (variant.stock_quantity < 0) {
                return res.status(400).json({ error: 'Stock quantity cannot be negative' });
            }
            
            await db.query(
                'UPDATE product_variants SET stock_quantity = ? WHERE product_id = ? AND size = ?',
                [variant.stock_quantity, req.params.id, variant.size]
            );
        }
        
        res.json({ success: true, message: 'Stock updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product image
router.delete('/products/:productId/images/:imageId', requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM product_images WHERE id = ? AND product_id = ?', 
            [req.params.imageId, req.params.productId]);
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add product image
router.post('/products/:id/images', requireAdmin, async (req, res) => {
    try {
        const { image_url } = req.body;
        
        if (!image_url) {
            return res.status(400).json({ error: 'Image URL is required' });
        }
        
        const [result] = await db.query(
            'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
            [req.params.id, image_url]
        );
        
        res.json({ success: true, id: result.insertId, message: 'Image added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
router.delete('/products/:id', requireAdmin, async (req, res) => {
    try {
        // Check if product exists in active orders
        const [orders] = await db.query(`
            SELECT COUNT(*) as count 
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.product_id = ? AND o.order_status != 'Delivered'
        `, [req.params.id]);
        
        if (orders[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete product with active orders',
                activeOrders: orders[0].count
            });
        }
        
        // Delete product (cascade will handle variants and images)
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get low stock products
router.get('/inventory/low-stock', requireAdmin, async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT p.id, p.name, pv.size, pv.stock_quantity, c.name as category_name
            FROM product_variants pv
            JOIN products p ON p.id = pv.product_id
            JOIN categories c ON c.id = p.category_id
            WHERE pv.stock_quantity < 5 AND pv.stock_quantity > 0
            ORDER BY pv.stock_quantity ASC
        `);
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
