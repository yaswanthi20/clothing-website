import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payment.js';
import paymentMockRoutes from './routes/payment-mock.js';
import adminRoutes from './routes/admin.js';
import adminOrderRoutes from './routes/admin-orders.js';
import adminCustomerRoutes from './routes/admin-customers.js';
import uploadRoutes from './routes/upload.js';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payment-mock', paymentMockRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/upload', uploadRoutes);

console.log('✅ All routes registered including /api/upload');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Women\'s Fashion E-commerce Server Started');
    console.log('='.repeat(60));
    console.log(`\n📍 Server running on: http://localhost:${PORT}`);
    console.log(`\n🔐 Test Accounts:`);
    console.log(`   Customer: test@example.com / password123`);
    console.log(`   Admin: admin@example.com / admin123`);
    console.log(`\n💳 Payment Mode: MOCK (No API keys required)`);
    console.log(`   Using: /api/payment-mock endpoints`);
    console.log(`   See: MOCK_PAYMENT_GUIDE.md for details`);
    console.log(`\n📚 Documentation:`);
    console.log(`   - README.md - Complete guide`);
    console.log(`   - QUICK_START.md - Get started in 5 minutes`);
    console.log(`   - MOCK_PAYMENT_GUIDE.md - Payment testing`);
    console.log('\n' + '='.repeat(60) + '\n');
});
