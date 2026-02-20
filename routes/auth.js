import express from 'express';
import bcrypt from 'bcrypt';
import db from '../database/db.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(
            'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
            [name, email, phone, hashedPassword]
        );
        
        res.json({ success: true, userId: result.insertId });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        req.session.userId = user.id;
        req.session.userRole = user.role;
        
        // Save session before responding
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, message: 'Session error' });
            }
            
            res.json({ 
                success: true, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    role: user.role 
                } 
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Check auth status
router.get('/status', (req, res) => {
    if (req.session.userId) {
        db.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.session.userId])
            .then(([users]) => {
                if (users.length > 0) {
                    res.json({ 
                        authenticated: true, 
                        user: users[0] 
                    });
                } else {
                    res.json({ authenticated: false });
                }
            })
            .catch(error => {
                console.error('Auth status error:', error);
                res.json({ authenticated: false });
            });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

export default router;
