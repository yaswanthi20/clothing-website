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

// Get all orders with filters
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { payment_status, order_status, start_date, end_date, search } = req.query;
        
        let query = `
            SELECT o.id, o.total_amount, o.payment_status, o.order_status, o.created_at,
                   u.name as customer_name, u.email, u.phone,
                   COUNT(oi.id) as item_count
            FROM orders o
            JOIN users u ON u.id = o.user_id
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE 1=1
        `;
        const params = [];
        
        if (payment_status) {
            query += ' AND o.payment_status = ?';
            params.push(payment_status);
        }
        
        if (order_status) {
            query += ' AND o.order_status = ?';
            params.push(order_status);
        }
        
        if (start_date) {
            query += ' AND DATE(o.created_at) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            query += ' AND DATE(o.created_at) <= ?';
            params.push(end_date);
        }
        
        if (search) {
            query += ' AND (u.name LIKE ? OR u.email LIKE ? OR o.id = ?)';
            params.push(`%${search}%`, `%${search}%`, search);
        }
        
        query += ' GROUP BY o.id ORDER BY o.created_at DESC';
        
        const [orders] = await db.query(query, params);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order details
router.get('/:id', requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, u.name as customer_name, u.email, u.phone,
                   p.payment_method, p.transaction_id, p.payment_gateway_id, p.created_at as payment_date
            FROM orders o
            JOIN users u ON u.id = o.user_id
            LEFT JOIN payments p ON p.order_id = o.id
            WHERE o.id = ?
        `, [req.params.id]);
        
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

// Update order status
router.put('/:id/status', requireAdmin, async (req, res) => {
    try {
        const { order_status } = req.body;
        
        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
        if (!validStatuses.includes(order_status)) {
            return res.status(400).json({ error: 'Invalid order status' });
        }
        
        // Get current order
        const [orders] = await db.query('SELECT order_status FROM orders WHERE id = ?', [req.params.id]);
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const currentStatus = orders[0].order_status;
        
        // Validate status transitions
        const validTransitions = {
            'Pending': ['Processing'],
            'Processing': ['Shipped'],
            'Shipped': ['Delivered'],
            'Delivered': []
        };
        
        if (!validTransitions[currentStatus]?.includes(order_status)) {
            return res.status(400).json({ 
                error: `Cannot change status from ${currentStatus} to ${order_status}`,
                currentStatus
            });
        }
        
        await db.query('UPDATE orders SET order_status = ? WHERE id = ?', [order_status, req.params.id]);
        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update payment status (for manual payment confirmation)
router.put('/:id/payment', requireAdmin, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { payment_status, transaction_id } = req.body;
        
        if (!['Pending', 'Paid', 'Failed'].includes(payment_status)) {
            return res.status(400).json({ error: 'Invalid payment status' });
        }
        
        // Get order details
        const [orders] = await connection.query(
            'SELECT id, payment_status FROM orders WHERE id = ?',
            [req.params.id]
        );
        
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const currentPaymentStatus = orders[0].payment_status;
        
        // If marking as Paid and was previously not Paid, reduce stock
        if (payment_status === 'Paid' && currentPaymentStatus !== 'Paid') {
            // Get order items
            const [items] = await connection.query(
                'SELECT product_id, size, quantity FROM order_items WHERE order_id = ?',
                [req.params.id]
            );
            
            // Reduce stock for each item
            for (const item of items) {
                // Check current stock
                const [variants] = await connection.query(
                    'SELECT stock_quantity FROM product_variants WHERE product_id = ? AND size = ?',
                    [item.product_id, item.size]
                );
                
                if (variants.length === 0 || variants[0].stock_quantity < item.quantity) {
                    await connection.rollback();
                    return res.status(400).json({ 
                        error: 'Insufficient stock for order fulfillment',
                        productId: item.product_id,
                        size: item.size
                    });
                }
                
                // Reduce stock
                await connection.query(
                    'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND size = ?',
                    [item.quantity, item.product_id, item.size]
                );
            }
        }
        
        // Update order payment status
        await connection.query(
            'UPDATE orders SET payment_status = ? WHERE id = ?',
            [payment_status, req.params.id]
        );
        
        // Update payment record
        await connection.query(
            'UPDATE payments SET payment_status = ?, transaction_id = ? WHERE order_id = ?',
            [payment_status === 'Paid' ? 'Success' : payment_status, transaction_id, req.params.id]
        );
        
        await connection.commit();
        res.json({ 
            success: true, 
            message: `Payment status updated to ${payment_status}`,
            stockReduced: payment_status === 'Paid' && currentPaymentStatus !== 'Paid'
        });
        
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Get order statistics
router.get('/stats/summary', requireAdmin, async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) as pending_payments,
                SUM(CASE WHEN order_status = 'Processing' THEN 1 ELSE 0 END) as processing_orders,
                SUM(CASE WHEN order_status = 'Shipped' THEN 1 ELSE 0 END) as shipped_orders,
                SUM(CASE WHEN order_status = 'Delivered' THEN 1 ELSE 0 END) as delivered_orders
            FROM orders
        `);
        
        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
