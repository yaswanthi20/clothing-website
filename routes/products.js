import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// Get all products with filters
router.get('/', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, size, sort } = req.query;
        
        let query = `
            SELECT p.*, c.name as category_name,
            (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as image,
            (SELECT SUM(stock_quantity) FROM product_variants WHERE product_id = p.id) as total_stock
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id AND stock_quantity > 0)
        `;
        const params = [];
        
        if (category) {
            query += ' AND c.name = ?';
            params.push(category);
        }
        
        if (minPrice) {
            query += ' AND (COALESCE(p.discount_price, p.price)) >= ?';
            params.push(minPrice);
        }
        
        if (maxPrice) {
            query += ' AND (COALESCE(p.discount_price, p.price)) <= ?';
            params.push(maxPrice);
        }
        
        if (size) {
            query += ' AND EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id AND size = ? AND stock_quantity > 0)';
            params.push(size);
        }
        
        if (sort === 'price_asc') query += ' ORDER BY COALESCE(p.discount_price, p.price) ASC';
        else if (sort === 'price_desc') query += ' ORDER BY COALESCE(p.discount_price, p.price) DESC';
        else query += ' ORDER BY p.created_at DESC';
        
        const [products] = await db.query(query, params);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [req.params.id]);
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const [images] = await db.query(
            'SELECT id, image_url FROM product_images WHERE product_id = ? ORDER BY id',
            [req.params.id]
        );
        
        const [variants] = await db.query(
            'SELECT id, size, stock_quantity FROM product_variants WHERE product_id = ? ORDER BY FIELD(size, "S", "M", "L", "XL")',
            [req.params.id]
        );
        
        res.json({ ...products[0], images, variants });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check stock availability
router.post('/check-stock', async (req, res) => {
    try {
        const { productId, size, quantity } = req.body;
        
        const [variants] = await db.query(
            'SELECT stock_quantity FROM product_variants WHERE product_id = ? AND size = ?',
            [productId, size]
        );
        
        if (variants.length === 0) {
            return res.json({ available: false, message: 'Size not available' });
        }
        
        const available = variants[0].stock_quantity >= quantity;
        const message = available ? 'In stock' : `Only ${variants[0].stock_quantity} items available`;
        
        res.json({ available, stock: variants[0].stock_quantity, message });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get categories
router.get('/categories/all', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
