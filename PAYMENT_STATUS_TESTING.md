# Payment Status Testing Guide

## Complete Testing for Success, Failure, and Pending Payments

This guide shows you how to test all three payment statuses in the mock payment system.

---

## Payment Status Overview

### 🟢 Success (Paid)
- Payment completed successfully
- Stock reduced from inventory
- Order status: Processing
- Cart cleared

### 🔴 Failure (Failed)
- Payment failed or declined
- Stock NOT reduced
- Order status: Pending
- Cart items remain

### 🟡 Pending
- Payment initiated but not completed
- User cancelled or closed modal
- Stock NOT reduced
- Order status: Pending
- Cart items remain

---

## Test Scenario 1: Successful Payment

### Customer Side

1. **Login:**
   ```
   Email: test@example.com
   Password: password123
   ```

2. **Add Products to Cart:**
   - Go to Shop page
   - Click on any product
   - Select size
   - Click "Add to Cart"

3. **Checkout:**
   - Go to Cart
   - Click "Proceed to Checkout"

4. **Fill Shipping Address:**
   ```
   Full Name: John Doe
   Phone: 9876543210
   Address Line 1: 123 Main Street
   City: Mumbai
   State: Maharashtra
   PIN Code: 400001
   ```

5. **Initiate Payment:**
   - Click "Pay via UPI"
   - Mock payment modal appears

6. **Simulate Success:**
   - Click "✓ Simulate Success" button
   - Wait for redirect

### Expected Results

✅ Redirected to success page
✅ Order ID displayed
✅ Payment Status: Paid
✅ Order Status: Processing

### Admin Panel Verification

1. **Login as Admin:**
   ```
   Email: admin@example.com
   Password: admin123
   ```

2. **View Orders:**
   - Go to Orders page
   - See new order with:
     - Payment: 🟢 Paid
     - Status: Processing

3. **Check Order Details:**
   - Click "View" on the order
   - Verify:
     - Payment Status: Paid ✓
     - Transaction ID: pay_mock_[timestamp]
     - Order Status: Processing

4. **Verify Stock:**
   - Go to Products page
   - Check stock quantity reduced

---

## Test Scenario 2: Failed Payment

### Customer Side

1. **Login and Add to Cart** (same as above)

2. **Go to Checkout** (same as above)

3. **Fill Address** (same as above)

4. **Initiate Payment:**
   - Click "Pay via UPI"
   - Mock payment modal appears

5. **Simulate Failure:**
   - Click "✗ Simulate Failure" button
   - Wait for redirect

### Expected Results

✅ Redirected to failure page
✅ Order ID displayed
✅ Payment Status: Failed
✅ Order Status: Pending
✅ Cart items still present

### Admin Panel Verification

1. **View Orders:**
   - See order with:
     - Payment: 🔴 Failed
     - Status: Pending

2. **Check Order Details:**
   - Payment Status: Failed
   - No transaction ID
   - Order Status: Pending

3. **Verify Stock:**
   - Stock NOT reduced
   - Same quantity as before

### Customer Can Retry

1. **Go back to Cart:**
   - Items still in cart
   - Can try payment again

---

## Test Scenario 3: Pending Payment (Cancelled)

### Customer Side

1. **Login and Add to Cart** (same as above)

2. **Go to Checkout** (same as above)

3. **Fill Address** (same as above)

4. **Initiate Payment:**
   - Click "Pay via UPI"
   - Mock payment modal appears

5. **Cancel Payment:**
   - Click "Cancel" button
   - Modal closes

### Expected Results

✅ Modal closed
✅ Still on checkout page
✅ Can retry payment
✅ Cart items remain

### Admin Panel Verification

1. **View Orders:**
   - Order created with:
     - Payment: 🟡 Pending
     - Status: Pending

2. **Check Order Details:**
   - Payment Status: Pending
   - No transaction ID
   - Order Status: Pending

3. **Verify Stock:**
   - Stock NOT reduced

---

## Complete Testing Checklist

### Success Flow
- [ ] Login as customer
- [ ] Add products to cart
- [ ] Proceed to checkout
- [ ] Fill shipping address
- [ ] Click "Pay via UPI"
- [ ] Click "Simulate Success"
- [ ] Verify success page
- [ ] Login as admin
- [ ] Verify order shows "Paid"
- [ ] Verify stock reduced
- [ ] Verify cart cleared

### Failure Flow
- [ ] Login as customer
- [ ] Add products to cart
- [ ] Proceed to checkout
- [ ] Fill shipping address
- [ ] Click "Pay via UPI"
- [ ] Click "Simulate Failure"
- [ ] Verify failure page
- [ ] Login as admin
- [ ] Verify order shows "Failed"
- [ ] Verify stock NOT reduced
- [ ] Verify cart items remain

### Pending Flow
- [ ] Login as customer
- [ ] Add products to cart
- [ ] Proceed to checkout
- [ ] Fill shipping address
- [ ] Click "Pay via UPI"
- [ ] Click "Cancel"
- [ ] Verify modal closes
- [ ] Login as admin
- [ ] Verify order shows "Pending"
- [ ] Verify stock NOT reduced

---

## Admin Panel Features

### Filter by Payment Status

1. **View All Paid Orders:**
   - Payment Status: Paid
   - Apply Filters

2. **View All Failed Orders:**
   - Payment Status: Failed
   - Apply Filters

3. **View All Pending Orders:**
   - Payment Status: Pending
   - Apply Filters

### Manual Status Update

For Pending or Failed orders, admin can:

1. **Mark as Paid:**
   - View order details
   - Click "Mark as Paid"
   - Enter transaction ID (optional)
   - Confirm
   - Stock will be reduced

2. **Mark as Failed:**
   - View order details
   - Click "Mark as Failed"
   - Confirm
   - Stock remains unchanged

---

## Order Status Flow

```
Payment Initiated
       ↓
   Order Created
       ↓
   Payment Status?
       ↓
   ┌───┴───┬───────┐
   ↓       ↓       ↓
 Paid   Failed  Pending
   ↓       ↓       ↓
Processing Pending Pending
   ↓
 Shipped
   ↓
Delivered
```

---

## Database Verification

### Check Payment Status

```sql
SELECT id, user_id, total_amount, payment_status, order_status, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

### Check Stock Changes

```sql
SELECT p.name, pv.size, pv.stock_quantity
FROM products p
JOIN product_variants pv ON pv.product_id = p.id
WHERE p.id = [product_id];
```

### Check Payment Records

```sql
SELECT o.id, o.payment_status, p.payment_status as payment_record_status, 
       p.transaction_id, p.payment_method
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id
ORDER BY o.created_at DESC
LIMIT 10;
```

---

## Quick Test Commands

### Create Successful Order
```bash
# 1. Login: test@example.com / password123
# 2. Add to cart
# 3. Checkout → Fill address
# 4. Pay → Simulate Success
# 5. Check admin panel
```

### Create Failed Order
```bash
# 1. Login: test@example.com / password123
# 2. Add to cart
# 3. Checkout → Fill address
# 4. Pay → Simulate Failure
# 5. Check admin panel
```

### Create Pending Order
```bash
# 1. Login: test@example.com / password123
# 2. Add to cart
# 3. Checkout → Fill address
# 4. Pay → Cancel
# 5. Check admin panel
```

---

## Expected Behavior Summary

| Action | Payment Status | Order Status | Stock | Cart |
|--------|---------------|--------------|-------|------|
| Simulate Success | Paid | Processing | Reduced | Cleared |
| Simulate Failure | Failed | Pending | Unchanged | Remains |
| Cancel Payment | Pending | Pending | Unchanged | Remains |
| Manual Mark Paid | Paid | Processing | Reduced | N/A |
| Manual Mark Failed | Failed | Pending | Unchanged | N/A |

---

## Troubleshooting

### "Data truncated for column 'order_status'"
**Solution:** Run `npm run fix-order-status`

### Payment status not showing in admin
**Solution:** Refresh the page, clear cache

### Stock not reducing on success
**Solution:** Check payment verification completed successfully

### Can't update payment status manually
**Solution:** Ensure logged in as admin, check stock availability

---

## All Status Combinations

### Payment Status + Order Status

1. **Pending + Pending** - Order created, payment not completed
2. **Failed + Pending** - Payment failed, order waiting
3. **Paid + Processing** - Payment successful, order being prepared
4. **Paid + Shipped** - Payment successful, order dispatched
5. **Paid + Delivered** - Payment successful, order completed

---

## Summary

✅ Three payment statuses: Success, Failure, Pending
✅ Color-coded badges in admin panel
✅ Stock management based on payment status
✅ Cart persistence for failed/pending payments
✅ Manual status update capability
✅ Complete order lifecycle tracking

Test all three scenarios to ensure the system works correctly! 🚀
