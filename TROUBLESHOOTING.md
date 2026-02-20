# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Unexpected token '<', '<!DOCTYPE'... is not valid JSON"

**Cause:** API endpoint is returning HTML instead of JSON (usually an error page)

**Solutions:**
1. **Restart the server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files
   - Reload page

3. **Check if logged in:**
   - Go to `/login.html`
   - Login with test credentials
   - Try again

4. **Verify routes are loaded:**
   - Check server console for errors
   - Look for "✓ Razorpay" or "⚠ Razorpay" message

---

### 2. "key_id or oauthToken is mandatory"

**Cause:** Razorpay trying to initialize without API keys

**Solution:** This is now fixed! The system automatically uses mock payment when keys are not configured.

**Verify fix:**
- Restart server
- Should see: "⚠ Razorpay keys not configured - use /api/payment-mock endpoints"
- Mock payment will work automatically

---

### 3. Login Not Working / Session Issues

**Symptoms:**
- Can't login
- Logged out immediately
- Session not persisting

**Solutions:**

1. **Check SESSION_SECRET in .env:**
   ```env
   SESSION_SECRET=your_secret_key_here
   ```

2. **Clear browser cookies:**
   - Open DevTools (F12)
   - Application tab → Cookies
   - Clear all cookies for localhost

3. **Restart server:**
   ```bash
   npm run dev
   ```

4. **Try incognito/private window**

---

### 4. Database Connection Error

**Symptoms:**
- "ECONNREFUSED"
- "Access denied for user"
- "Unknown database"

**Solutions:**

1. **Check MySQL is running:**
   - Windows: Check Services
   - Verify MySQL service is started

2. **Verify .env credentials:**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_actual_password
   DB_NAME=womens_fashion_db
   ```

3. **Setup database:**
   ```bash
   npm run db:setup
   npm run db:seed
   ```

4. **Test connection:**
   ```bash
   npm run check-admin
   ```

---

### 5. Cart Not Loading

**Symptoms:**
- Empty cart page
- "Please login" message
- Cart items disappear

**Solutions:**

1. **Ensure logged in:**
   - Check if "Hi, [Name]" appears in navbar
   - If not, login again

2. **Check localStorage:**
   - Open DevTools (F12)
   - Console tab
   - Type: `localStorage.getItem('user')`
   - Should show user data

3. **Clear and re-login:**
   ```javascript
   // In browser console:
   localStorage.clear();
   // Then login again
   ```

---

### 6. Payment Modal Not Appearing

**Symptoms:**
- Click "Pay via UPI" but nothing happens
- No modal shows up

**Solutions:**

1. **Check browser console (F12):**
   - Look for JavaScript errors
   - Fix any errors shown

2. **Verify checkout-mock.js is loaded:**
   - View page source
   - Should see: `<script src="/js/checkout-mock.js"></script>`

3. **Clear cache and reload:**
   - Ctrl+Shift+R (hard reload)

4. **Check if form is valid:**
   - Fill all required fields
   - Verify PIN code is 6 digits

---

### 7. Stock Not Reducing After Payment

**Symptoms:**
- Payment successful
- But stock quantity unchanged

**Solutions:**

1. **Check payment was successful:**
   - Go to admin panel
   - Check order status = "Paid"

2. **Verify database transaction:**
   - Check server console for errors
   - Look for "Payment verification error"

3. **Manual check:**
   ```sql
   SELECT * FROM orders WHERE id = [order_id];
   SELECT * FROM product_variants WHERE product_id = [product_id];
   ```

---

### 8. Admin Panel Not Loading

**Symptoms:**
- Blank page
- 404 error
- Can't access /admin/

**Solutions:**

1. **Login as admin:**
   ```
   Email: admin@example.com
   Password: admin123
   ```

2. **Check admin user exists:**
   ```bash
   npm run check-admin
   ```

3. **Verify role in database:**
   ```sql
   SELECT * FROM users WHERE email = 'admin@example.com';
   -- role should be 'admin'
   ```

---

### 9. Products Not Showing

**Symptoms:**
- Empty shop page
- "No products found"

**Solutions:**

1. **Seed database:**
   ```bash
   npm run db:seed
   ```

2. **Check products exist:**
   ```sql
   SELECT COUNT(*) FROM products;
   ```

3. **Verify stock:**
   ```sql
   SELECT p.name, SUM(pv.stock_quantity) as total_stock
   FROM products p
   JOIN product_variants pv ON pv.product_id = p.id
   GROUP BY p.id;
   ```

---

### 10. Port Already in Use

**Symptoms:**
- "EADDRINUSE: address already in use"
- Can't start server

**Solutions:**

1. **Kill existing process:**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID [PID_NUMBER] /F
   ```

2. **Use different port:**
   ```env
   # In .env
   PORT=3001
   ```

3. **Restart computer** (last resort)

---

## Quick Fixes Checklist

When something goes wrong, try these in order:

- [ ] Restart the server
- [ ] Clear browser cache
- [ ] Clear browser cookies
- [ ] Logout and login again
- [ ] Clear localStorage
- [ ] Try incognito/private window
- [ ] Check browser console for errors
- [ ] Check server console for errors
- [ ] Verify .env file exists and is correct
- [ ] Run `npm run check-admin`
- [ ] Restart MySQL service
- [ ] Restart computer

---

## Getting Help

### Check Logs

**Browser Console (F12):**
- Shows JavaScript errors
- Network requests
- API responses

**Server Console:**
- Shows route errors
- Database errors
- Payment processing logs

### Verify Setup

```bash
# Check database
npm run check-admin

# Check routes
npm run dev
# Look for startup messages

# Check environment
cat .env  # Linux/Mac
type .env  # Windows
```

### Test Endpoints

Open browser and visit:
- http://localhost:3000 - Home page
- http://localhost:3000/api/auth/status - Auth status
- http://localhost:3000/shop.html - Shop page

---

## Still Having Issues?

1. **Check documentation:**
   - README.md
   - QUICK_START.md
   - MOCK_PAYMENT_GUIDE.md

2. **Verify all files exist:**
   - routes/payment-mock.js
   - public/js/checkout-mock.js
   - public/js/auth-check.js

3. **Fresh start:**
   ```bash
   # Backup .env
   copy .env .env.backup
   
   # Reinstall
   npm install
   
   # Reset database
   npm run db:setup
   npm run db:seed
   
   # Start server
   npm run dev
   ```

---

## Error Messages Explained

### "Authentication required"
→ You need to login first

### "Cart is empty"
→ Add items to cart before checkout

### "Insufficient stock"
→ Not enough items available

### "Invalid credentials"
→ Wrong email or password

### "Order not found"
→ Order ID doesn't exist or doesn't belong to you

### "Shipping address is required"
→ Fill the address form completely

---

## Prevention Tips

1. **Always login before:**
   - Adding to cart
   - Viewing cart
   - Checkout

2. **Keep server running:**
   - Don't close terminal
   - Watch for errors

3. **Use correct credentials:**
   - Customer: test@example.com / password123
   - Admin: admin@example.com / admin123

4. **Clear cache regularly:**
   - Especially after code changes
   - Use Ctrl+Shift+R for hard reload

5. **Check console:**
   - Browser console (F12)
   - Server console
   - Look for errors

---

Happy Coding! 🚀
