# Quick Start Guide - Women's Fashion E-commerce

## Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Database
Create `.env` file:
```bash
copy .env.example .env
```

Edit `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=womens_fashion_db
SESSION_SECRET=my_secret_key_12345
PORT=3000

# Razorpay Test Keys (Get from https://razorpay.com/)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Step 3: Setup Database
```bash
npm run db:setup
npm run db:seed
```

### Step 4: Start Server
```bash
npm run dev
```

Visit: http://localhost:3000

---

## Test Accounts

### Customer Account
- Email: `test@example.com`
- Password: `password123`

### Admin Account
- Email: `admin@example.com`
- Password: `admin123`

---

## Test Payment (Razorpay Test Mode)

### Get Razorpay Test Keys
1. Sign up at https://razorpay.com/
2. Go to Settings → API Keys
3. Generate Test Key
4. Copy Key ID and Key Secret to `.env`

### Test UPI IDs
- **Success:** `success@razorpay`
- **Failure:** `failure@razorpay`

---

## Quick Test Flow

### Customer Flow
1. Login: `test@example.com` / `password123`
2. Browse products at `/shop.html`
3. Click on any product
4. Select size and "Add to Cart"
5. Go to Cart (`/cart.html`)
6. Click "Proceed to Checkout"
7. Fill shipping address
8. Click "Pay via UPI"
9. Use test UPI: `success@razorpay`
10. See success page!

### Admin Flow
1. Login: `admin@example.com` / `admin123`
2. View dashboard at `/admin/index.html`
3. See orders, products, customers
4. Manage inventory
5. Update order status

---

## Features to Test

### Product Browsing
- [x] Filter by category
- [x] Filter by size
- [x] Filter by price range
- [x] Sort products
- [x] View product details
- [x] Image carousel

### Cart Management
- [x] Add to cart
- [x] Update quantity
- [x] Remove items
- [x] Stock validation
- [x] Cart persistence

### Checkout & Payment
- [x] Shipping address form
- [x] Order summary
- [x] UPI payment
- [x] Payment success
- [x] Payment failure
- [x] Stock reduction

### Admin Panel
- [x] View all orders
- [x] Filter orders by status
- [x] View order details
- [x] Manage products
- [x] View customers
- [x] Dashboard statistics

---

## Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
# Verify credentials in .env
npm run check-admin
```

### Payment Not Working
```bash
# Verify Razorpay keys in .env
# Check console for errors
# Ensure you're using test keys (rzp_test_)
```

### Admin Login Not Working
```bash
# Create admin user
npm run check-admin
```

---

## Project Structure

```
├── database/
│   ├── db.js              # Database connection
│   ├── schema.sql         # Database schema
│   ├── setup.js           # Setup script
│   └── seed.js            # Sample data
├── routes/
│   ├── auth.js            # Authentication
│   ├── products.js        # Product APIs
│   ├── cart.js            # Cart APIs
│   ├── orders.js          # Order APIs
│   ├── payment.js         # Payment APIs
│   └── admin.js           # Admin APIs
├── public/
│   ├── index.html         # Home page
│   ├── shop.html          # Shop page
│   ├── product.html       # Product detail
│   ├── cart.html          # Shopping cart
│   ├── checkout.html      # Checkout page
│   ├── login.html         # Login/Signup
│   ├── payment-success.html
│   ├── payment-failed.html
│   ├── admin/             # Admin panel
│   ├── css/               # Stylesheets
│   └── js/                # Frontend scripts
├── server.js              # Express server
├── package.json           # Dependencies
└── .env                   # Configuration
```

---

## Documentation

- [PAYMENT_SETUP.md](PAYMENT_SETUP.md) - Razorpay setup guide
- [TESTING.md](TESTING.md) - Testing scenarios
- [PHASE2_SUMMARY.md](PHASE2_SUMMARY.md) - Phase 2 features
- [PHASE4_SUMMARY.md](PHASE4_SUMMARY.md) - Phase 4 features
- [README.md](README.md) - Complete documentation

---

## Support

For issues or questions:
1. Check documentation files
2. Review error logs in console
3. Verify environment variables
4. Check database connection

---

## Next Steps

After testing:
1. Customize product categories
2. Add real product images
3. Configure live Razorpay keys
4. Deploy to production
5. Set up SSL certificate
6. Configure webhook URL

---

Happy Testing! 🚀
