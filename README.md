# Women's Fashion E-commerce Website

India-based women's clothing store with UPI payment integration.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
Create a `.env` file from `.env.example`:
```bash
copy .env.example .env
```

Update the `.env` file with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=womens_fashion_db
SESSION_SECRET=your_secret_key
PORT=3000
```

### 3. Setup Database
Run the database setup script:
```bash
npm run db:setup
```

This will:
- Create the database
- Create all tables with proper relationships
- Insert default categories (Dresses, Tops, Kurtis, Sarees, Co-ord Sets)

### 4. Start Server
```bash
npm run dev
```

Visit: http://localhost:3000

### 5. (Optional) Seed Sample Data
To populate the database with sample products and test users:
```bash
npm run db:seed
```

Test credentials:
- Customer: test@example.com / password123
- Admin: admin@example.com / admin123

### 6. Configure Payment System

**Option A: Mock Payment (No API Keys Required - Recommended for Development)**

The site is pre-configured with a mock payment system. No setup needed!
- Just start the server and test payments
- See [MOCK_PAYMENT_GUIDE.md](MOCK_PAYMENT_GUIDE.md) for details

**Option B: Real Razorpay (For Production)**

1. Sign up at [Razorpay](https://razorpay.com/)
2. Get Test API Keys from dashboard
3. Add to `.env` file:
```env
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```
4. Update `public/checkout.html` to use real Razorpay script

See [PAYMENT_SETUP.md](PAYMENT_SETUP.md) for detailed Razorpay setup.

### 7. Image Upload System

The admin panel includes a secure image upload system:
- Upload product images directly from admin panel
- No need to enter image URLs manually
- Supports JPG, JPEG, PNG, WEBP (max 2MB per image)
- Images organized by product ID
- See [IMAGE_UPLOAD_GUIDE.md](IMAGE_UPLOAD_GUIDE.md) for complete documentation

**Quick Start:**
1. Login as admin
2. Go to Products → Add Product
3. Click "Choose Files" and select images
4. Click "📤 Upload Images"
5. Save product

## Database Schema

### Tables Created:
- **users** - Customer and admin accounts with encrypted passwords
- **categories** - Product categories
- **products** - Product catalog with pricing and details
- **product_variants** - Size and stock management
- **product_images** - Product image URLs
- **cart** - User shopping carts
- **cart_items** - Items in cart
- **orders** - Order records
- **order_items** - Products in orders
- **payments** - UPI payment tracking (Razorpay ready)

### Key Features:
- Foreign key relationships for data integrity
- Indexed columns for performance
- Bcrypt password encryption
- Session-based authentication
- Scalable architecture

## Pages Implemented

1. **Home** (`/`) - Hero banner, new arrivals, categories
2. **Shop** (`/shop.html`) - Product grid with filters
3. **Product** (`/product.html`) - Product details, size selection
4. **Cart** (`/cart.html`) - Shopping cart management
5. **Login/Signup** (`/login.html`) - User authentication

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products (with filters: category, size, minPrice, maxPrice, sort)
- `GET /api/products/:id` - Get single product with variants and images
- `GET /api/products/categories/all` - Get all categories
- `POST /api/products/check-stock` - Check stock availability for product/size

### Cart
- `GET /api/cart` - Get user cart with items
- `POST /api/cart/add` - Add item to cart (with stock validation)
- `PUT /api/cart/update/:id` - Update cart item quantity
- `DELETE /api/cart/remove/:id` - Remove item from cart
- `POST /api/cart/validate` - Validate cart before checkout

### Orders
- `POST /api/orders/prepare` - Prepare order (creates order record)
- `GET /api/orders/my-orders` - Get user's order history
- `GET /api/orders/:id` - Get order details

### Payment (Phase 4)
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify payment signature
- `POST /api/payment/payment-failed` - Handle payment failure
- `POST /api/payment/webhook` - Razorpay webhook endpoint

### Image Upload (Admin)
- `POST /api/upload/product-image` - Upload single product image
- `POST /api/upload/product-images` - Upload multiple product images (max 5)
- `DELETE /api/upload/product-image` - Delete product image

## Phase 2 Features Implemented (Product & Cart Logic)

### Razorpay Integration
✓ UPI-only payment gateway
✓ UPI Intent (Google Pay, PhonePe, etc.)
✓ UPI Collect (Manual UPI ID)
✓ Cards/Netbanking/Wallets disabled
✓ Secure payment verification
✓ Signature validation

### Checkout System
✓ Dedicated checkout page
✓ Shipping address form
✓ Order summary display
✓ Real-time total calculation
✓ Razorpay payment modal
✓ UPI payment options only

### Payment Verification
✓ Backend signature verification
✓ HMAC SHA256 validation
✓ Order status updates
✓ Payment record creation
✓ Transaction ID storage
✓ Idempotent processing

### Stock Management
✓ Stock reduced only after successful payment
✓ Database transactions for consistency
✓ Prevents overselling
✓ Rollback on payment failure
✓ No stock deduction on failed payments

### Order Lifecycle
✓ Order creation with pending status
✓ Payment success → Order status "Paid"
✓ Payment failure → Order status "Failed"
✓ Cart cleared after successful payment
✓ Cart retained after failed payment

### Webhook Implementation
✓ Razorpay webhook endpoint
✓ Webhook signature verification
✓ payment.captured event handling
✓ payment.failed event handling
✓ Idempotent webhook processing
✓ Reliable payment updates

### User Experience
✓ Payment success page
✓ Payment failure page
✓ Clear error messages
✓ Retry payment option
✓ Order confirmation display
✓ Secure payment indicators

### Security
✓ API keys in environment variables
✓ No sensitive data in frontend
✓ Server-side signature verification
✓ Webhook signature validation
✓ HTTPS-ready configuration
✓ Amount validation server-side

### Product Logic
✓ Dynamic product fetching with filters (category, size, price, sort)
✓ Only show products with available stock
✓ Product detail page with image carousel
✓ Size selection with stock validation
✓ Disable out-of-stock sizes
✓ Real-time stock checking

### Cart System
✓ Authentication required for cart operations
✓ Add to cart with duplicate detection (increases quantity)
✓ Stock validation before adding items
✓ Quantity controls with min/max validation
✓ Cannot exceed available stock
✓ Remove items from cart
✓ Cart persistence in database
✓ Real-time subtotal calculation
✓ Visual feedback with toast messages

### Order Preparation
✓ Cart validation before checkout
✓ Stock re-validation at checkout
✓ Order creation with pending status
✓ Order items tracking
✓ Payment record creation (UPI ready)
✓ Transaction management with rollback

### Business Rules Enforced
✓ Authentication required for cart/orders
✓ No duplicate cart entries (auto-merge)
✓ Stock validation at every step
✓ Proper relational integrity
✓ Secure session handling
✓ Optimized database queries

### User Experience
✓ Smooth cart updates without page reload
✓ Clear error messages
✓ Toast notifications for actions
✓ Mobile-optimized design
✓ Loading states on buttons
✓ Confirmation dialogs
✓ Stock availability indicators

## Next Phase (Phase 5)
- Automated refund processing
- Order tracking with shipping integration
- Email/SMS notifications
- Customer order history page
- Invoice generation
- Return/exchange management
- Payment analytics dashboard
- Advanced reporting

## Tech Stack
- Node.js + Express
- MySQL
- Vanilla JavaScript
- Responsive CSS (mobile-first)
