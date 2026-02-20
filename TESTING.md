# Testing Guide - Phase 2

## Setup for Testing

1. Ensure database is set up:
```bash
npm run db:setup
```

2. Seed sample data:
```bash
npm run db:seed
```

3. Start server:
```bash
npm run dev
```

## Test Scenarios

### 1. Product Browsing
- [ ] Visit home page - should show new arrivals and categories
- [ ] Click "Shop Now" or navigate to /shop.html
- [ ] Verify products are displayed with images and prices
- [ ] Test category filter dropdown
- [ ] Test size filter (S, M, L, XL)
- [ ] Test price range filter
- [ ] Test sorting (Latest, Price Low to High, Price High to Low)
- [ ] Verify only products with stock are shown

### 2. Product Details
- [ ] Click on any product card
- [ ] Verify product details load correctly
- [ ] Test image carousel (if multiple images)
- [ ] Check size options display
- [ ] Verify out-of-stock sizes are disabled and marked
- [ ] Try clicking "Add to Cart" without selecting size - should show error
- [ ] Select a size and add to cart

### 3. Authentication Flow
- [ ] Try adding to cart without login - should redirect to login
- [ ] Register new account at /login.html
- [ ] Verify password is required
- [ ] Toggle to login form
- [ ] Login with test credentials (test@example.com / password123)
- [ ] Verify redirect after successful login

### 4. Cart Operations
- [ ] Add product to cart - should show success message
- [ ] Add same product with same size - should increase quantity
- [ ] Navigate to /cart.html
- [ ] Verify cart items display correctly
- [ ] Test quantity increase button
- [ ] Test quantity decrease button
- [ ] Try to increase quantity beyond stock - should be disabled
- [ ] Try to decrease below 1 - should be disabled
- [ ] Verify subtotal updates correctly
- [ ] Remove an item - should show confirmation
- [ ] Verify cart updates after removal

### 5. Stock Validation
- [ ] Add product to cart with max quantity
- [ ] Try to add more of same product - should show stock error
- [ ] In cart, try to increase quantity beyond available stock
- [ ] Verify error message shows available stock count

### 6. Checkout Preparation
- [ ] With items in cart, click "Proceed to Checkout"
- [ ] Enter shipping address when prompted
- [ ] Verify order is created successfully
- [ ] Check order ID is displayed
- [ ] Verify total amount is correct

### 7. Edge Cases
- [ ] Try accessing /cart.html without login - should show login prompt
- [ ] Empty cart and try checkout - should show error
- [ ] Add product, then manually reduce stock in database, try checkout - should show stock error
- [ ] Test with multiple products in cart
- [ ] Test with products from different categories

## Expected Behaviors

### Product Filtering
- Filters should work independently and in combination
- Results should update based on selected filters
- No products shown if filters don't match any items

### Cart Management
- Cart persists after page refresh
- Cart is user-specific (tied to logged-in user)
- Quantity cannot go below 1 or above available stock
- Subtotal recalculates automatically

### Stock Validation
- Stock checked when adding to cart
- Stock re-validated at checkout
- Clear error messages for stock issues
- Shows available quantity in error messages

### User Experience
- Toast notifications for all actions
- Loading states on buttons
- Confirmation dialogs for destructive actions
- Responsive design works on mobile
- Clear error messages

## API Testing (Optional)

Use tools like Postman or curl to test API endpoints:

### Get Products
```bash
curl http://localhost:3000/api/products
```

### Get Product by ID
```bash
curl http://localhost:3000/api/products/1
```

### Check Stock
```bash
curl -X POST http://localhost:3000/api/products/check-stock \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "size": "M", "quantity": 2}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  -c cookies.txt
```

### Get Cart (requires login)
```bash
curl http://localhost:3000/api/cart -b cookies.txt
```

### Add to Cart (requires login)
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "size": "M", "quantity": 1}' \
  -b cookies.txt
```

## Known Limitations (To be implemented in Phase 3)
- No actual payment processing yet
- No email notifications
- No order tracking page
- No admin panel
- Stock is not deducted after order (only validated)
- Placeholder images used for products

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check .env file has correct credentials
- Ensure database exists

### Session Issues
- Clear browser cookies
- Check SESSION_SECRET is set in .env
- Restart server

### Cart Not Persisting
- Ensure you're logged in
- Check browser allows cookies
- Verify database cart tables exist
