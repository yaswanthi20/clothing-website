import express from 'express';
import crypto from 'crypto';
import db from '../database/db.js';

const router = express.Router();

// Mock mode flag - set to true for development without Razorpay
const MOCK_MODE = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id';

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Create mock order (simulates Razorpay)
router.post('/create-order', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { shippingAddress } = req.body;
        
        if (!shippingAddress || !shippingAddress.trim()) {
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
        
        // Create order in database
        const [orderResult] = await connection.query(
            `INSERT INTO orders (user_id, total_amount, payment_status, order_status, shipping_address) 
             VALUES (?, ?, 'Pending', 'Pending', ?)`,
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
        
        // Generate mock Razorpay order ID
        const mockOrderId = `order_mock_${orderId}_${Date.now()}`;
        
        // Create payment record
        await connection.query(
            `INSERT INTO payments (order_id, payment_gateway_id, payment_method, payment_status) 
             VALUES (?, ?, 'UPI', 'Pending')`,
            [orderId, mockOrderId]
        );
        
        await connection.commit();
        
        res.json({ 
            success: true,
            orderId,
            razorpayOrderId: mockOrderId,
            amount: totalAmount,
            currency: 'INR',
            keyId: 'rzp_test_mock_key',
            mockMode: true
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Verify mock payment
router.post('/verify-payment', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { razorpay_order_id, razorpay_payment_id, order_id } = req.body;
        
        await connection.beginTransaction();
        
        // Get order details
        const [orders] = await connection.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [order_id, req.session.userId]
        );
        
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const order = orders[0];
        
        // Prevent duplicate processing
        if (order.payment_status === 'Paid') {
            await connection.rollback();
            return res.json({ 
                success: true, 
                message: 'Payment already processed',
                orderId: order_id 
            });
        }
        
        // Update order status
        await connection.query(
            `UPDATE orders SET payment_status = 'Paid', order_status = 'Processing' 
             WHERE id = ?`,
            [order_id]
        );
        
        // Update payment record
        await connection.query(
            `UPDATE payments SET 
             payment_status = 'Success', 
             transaction_id = ?,
             payment_gateway_id = ?
             WHERE order_id = ?`,
            [razorpay_payment_id, razorpay_order_id, order_id]
        );
        
        // Reduce stock
        const [orderItems] = await connection.query(
            'SELECT product_id, size, quantity FROM order_items WHERE order_id = ?',
            [order_id]
        );
        
        for (const item of orderItems) {
            await connection.query(
                `UPDATE product_variants 
                 SET stock_quantity = stock_quantity - ? 
                 WHERE product_id = ? AND size = ? AND stock_quantity >= ?`,
                [item.quantity, item.product_id, item.size, item.quantity]
            );
        }
        
        // Clear user's cart
        const [carts] = await connection.query(
            'SELECT id FROM cart WHERE user_id = ?',
            [req.session.userId]
        );
        
        if (carts.length > 0) {
            await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id]);
        }
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            message: 'Payment verified successfully',
            orderId: order_id
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Payment verification error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Handle payment failure
router.post('/payment-failed', requireAuth, async (req, res) => {
    try {
        const { order_id, error_description } = req.body;
        
        // Update order status
        await db.query(
            `UPDATE orders SET payment_status = 'Failed' WHERE id = ? AND user_id = ?`,
            [order_id, req.session.userId]
        );
        
        // Update payment record
        await db.query(
            `UPDATE payments SET payment_status = 'Failed' WHERE order_id = ?`,
            [order_id]
        );
        
        res.json({ 
            success: true, 
            message: 'Payment failure recorded' 
        });
        
    } catch (error) {
        console.error('Payment failure handler error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
