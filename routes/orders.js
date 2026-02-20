import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Prepare order (before payment)
router.post('/prepare', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { shippingAddress } = req.body;
        
        if (!shippingAddress) {
            return res.status(400).json({ error: 'Shipping address is required' });
        }
        
        // Get user's cart
        const [carts] = await connection.query(
            'SELECT id FROM cart WHERE user_id = ?',
            [req.session.userId]
        );
        
        if (carts.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cart is empty' });
        }
        
        // Get cart items with stock validation
        const [items] = await connection.query(`
            SELECT ci.id, ci.product_id, ci.size, ci.quantity,
                   p.name, p.price, p.discount_price,
                   pv.stock_quantity, pv.id as variant_id
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            JOIN product_variants pv ON pv.product_id = ci.product_id AND pv.size = ci.size
            WHERE ci.cart_id = ?
        `, [carts[0].id]);
        
        if (items.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cart is empty' });
        }
        
        // Validate stock for all items
        const stockIssues = [];
        let totalAmount = 0;
        
        for (const item of items) {
            if (item.stock_quantity < item.quantity) {
                stockIssues.push({
                    productName: item.name,
                    size: item.size,
                    requested: item.quantity,
                    available: item.stock_quantity
                });
            }
            
            const itemPrice = item.discount_price || item.price;
            totalAmount += itemPrice * item.quantity;
        }
        
        if (stockIssues.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'Some items have insufficient stock',
                stockIssues 
            });
        }
        
        // Create order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (user_id, total_amount, payment_status, order_status, shipping_address) 
             VALUES (?, ?, 'Pending', 'Processing', ?)`,
            [req.session.userId, totalAmount, shippingAddress]
        );
        
        const orderId = orderResult.insertId;
        
        // Create order items
        for (const item of items) {
            const itemPrice = item.discount_price || item.price;
            
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, size, quantity, price) 
                 VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.size, item.quantity, itemPrice]
            );
        }
        
        // Create payment record
        await connection.query(
            `INSERT INTO payments (order_id, payment_method, payment_status) 
             VALUES (?, 'UPI', 'Pending')`,
            [orderId]
        );
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            orderId,
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            message: 'Order prepared successfully'
        });
        
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Get user orders
router.get('/my-orders', requireAuth, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.id, o.total_amount, o.payment_status, o.order_status, 
                   o.shipping_address, o.created_at,
                   COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [req.session.userId]);
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order details
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, p.payment_status as payment_status_detail, 
                   p.transaction_id, p.created_at as payment_date
            FROM orders o
            LEFT JOIN payments p ON p.order_id = o.id
            WHERE o.id = ? AND o.user_id = ?
        `, [req.params.id, req.session.userId]);
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const [items] = await db.query(`
            SELECT oi.*, p.name, p.description,
                   (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as image
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ?
        `, [req.params.id]);
        
        res.json({ ...orders[0], items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
