import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required', requireLogin: true });
    }
    next();
};

// Get cart
router.get('/', requireAuth, async (req, res) => {
    try {
        const [carts] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.session.userId]);
        
        if (carts.length === 0) {
            return res.json({ items: [], total: 0 });
        }
        
        const [items] = await db.query(`
            SELECT ci.id, ci.product_id, ci.size, ci.quantity,
                   p.name, p.price, p.discount_price,
                   pv.stock_quantity,
                   (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as image
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            JOIN product_variants pv ON pv.product_id = p.id AND pv.size = ci.size
            WHERE ci.cart_id = ?
        `, [carts[0].id]);
        
        const total = items.reduce((sum, item) => {
            const price = item.discount_price || item.price;
            return sum + (price * item.quantity);
        }, 0);
        
        res.json({ items, total: parseFloat(total.toFixed(2)) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add to cart
router.post('/add', requireAuth, async (req, res) => {
    try {
        const { productId, size, quantity = 1 } = req.body;
        
        // Validate input
        if (!productId || !size) {
            return res.status(400).json({ error: 'Product ID and size are required' });
        }
        
        // Check stock availability
        const [variants] = await db.query(
            'SELECT stock_quantity FROM product_variants WHERE product_id = ? AND size = ?',
            [productId, size]
        );
        
        if (variants.length === 0) {
            return res.status(400).json({ error: 'Selected size not available' });
        }
        
        if (variants[0].stock_quantity < quantity) {
            return res.status(400).json({ 
                error: 'Insufficient stock', 
                available: variants[0].stock_quantity 
            });
        }
        
        // Get or create cart
        let [carts] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.session.userId]);
        
        if (carts.length === 0) {
            const [result] = await db.query('INSERT INTO cart (user_id) VALUES (?)', [req.session.userId]);
            carts = [{ id: result.insertId }];
        }
        
        const cartId = carts[0].id;
        
        // Check if item already exists in cart
        const [existingItems] = await db.query(
            'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND size = ?',
            [cartId, productId, size]
        );
        
        if (existingItems.length > 0) {
            // Update existing item
            const newQuantity = existingItems[0].quantity + quantity;
            
            if (newQuantity > variants[0].stock_quantity) {
                return res.status(400).json({ 
                    error: 'Cannot add more items. Insufficient stock',
                    available: variants[0].stock_quantity,
                    currentInCart: existingItems[0].quantity
                });
            }
            
            await db.query(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [newQuantity, existingItems[0].id]
            );
        } else {
            // Add new item
            await db.query(
                'INSERT INTO cart_items (cart_id, product_id, size, quantity) VALUES (?, ?, ?, ?)',
                [cartId, productId, size, quantity]
            );
        }
        
        res.json({ success: true, message: 'Item added to cart' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update cart item quantity
router.put('/update/:id', requireAuth, async (req, res) => {
    try {
        const { quantity } = req.body;
        
        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }
        
        // Get cart item details
        const [items] = await db.query(`
            SELECT ci.cart_id, ci.product_id, ci.size, pv.stock_quantity
            FROM cart_items ci
            JOIN product_variants pv ON pv.product_id = ci.product_id AND pv.size = ci.size
            WHERE ci.id = ?
        `, [req.params.id]);
        
        if (items.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        
        // Verify cart belongs to user
        const [carts] = await db.query(
            'SELECT user_id FROM cart WHERE id = ?',
            [items[0].cart_id]
        );
        
        if (carts.length === 0 || carts[0].user_id !== req.session.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        // Check stock
        if (quantity > items[0].stock_quantity) {
            return res.status(400).json({ 
                error: 'Insufficient stock',
                available: items[0].stock_quantity
            });
        }
        
        await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, req.params.id]);
        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove from cart
router.delete('/remove/:id', requireAuth, async (req, res) => {
    try {
        // Verify item belongs to user's cart
        const [items] = await db.query(`
            SELECT ci.cart_id
            FROM cart_items ci
            JOIN cart c ON c.id = ci.cart_id
            WHERE ci.id = ? AND c.user_id = ?
        `, [req.params.id, req.session.userId]);
        
        if (items.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        
        await db.query('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Validate cart before checkout
router.post('/validate', requireAuth, async (req, res) => {
    try {
        const [carts] = await db.query('SELECT id FROM cart WHERE user_id = ?', [req.session.userId]);
        
        if (carts.length === 0) {
            return res.json({ valid: false, error: 'Cart is empty' });
        }
        
        const [items] = await db.query(`
            SELECT ci.id, ci.product_id, ci.size, ci.quantity, 
                   p.name, pv.stock_quantity
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            JOIN product_variants pv ON pv.product_id = ci.product_id AND pv.size = ci.size
            WHERE ci.cart_id = ?
        `, [carts[0].id]);
        
        if (items.length === 0) {
            return res.json({ valid: false, error: 'Cart is empty' });
        }
        
        // Check stock for all items
        const stockIssues = [];
        for (const item of items) {
            if (item.stock_quantity < item.quantity) {
                stockIssues.push({
                    productName: item.name,
                    size: item.size,
                    requested: item.quantity,
                    available: item.stock_quantity
                });
            }
        }
        
        if (stockIssues.length > 0) {
            return res.json({ 
                valid: false, 
                error: 'Some items have insufficient stock',
                stockIssues 
            });
        }
        
        res.json({ valid: true, itemCount: items.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
