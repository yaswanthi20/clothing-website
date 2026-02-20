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

// Get all customers
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { search } = req.query;
        
        let query = `
            SELECT u.id, u.name, u.email, u.phone, u.created_at,
                   COUNT(DISTINCT o.id) as order_count,
                   SUM(CASE WHEN o.payment_status = 'Paid' THEN o.total_amount ELSE 0 END) as total_spent
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            WHERE u.role = 'customer'
        `;
        const params = [];
        
        if (search) {
            query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        query += ' GROUP BY u.id ORDER BY u.created_at DESC';
        
        const [customers] = await db.query(query, params);
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer details
router.get('/:id', requireAdmin, async (req, res) => {
    try {
        const [customers] = await db.query(`
            SELECT u.id, u.name, u.email, u.phone, u.created_at,
                   COUNT(DISTINCT o.id) as order_count,
                   SUM(CASE WHEN o.payment_status = 'Paid' THEN o.total_amount ELSE 0 END) as total_spent
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            WHERE u.id = ? AND u.role = 'customer'
            GROUP BY u.id
        `, [req.params.id]);
        
        if (customers.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json(customers[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer order history
router.get('/:id/orders', requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.id, o.total_amount, o.payment_status, o.order_status, o.created_at,
                   COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [req.params.id]);
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
