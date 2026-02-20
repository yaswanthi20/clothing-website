# Mock Payment System Guide

## Overview

The mock payment system allows you to test the complete payment flow without requiring actual Razorpay API keys. This is perfect for development and testing.

---

## Features

✅ Complete payment flow simulation
✅ No Razorpay account needed
✅ No API keys required
✅ Test success and failure scenarios
✅ Stock management works correctly
✅ Order creation and tracking
✅ Cart clearing after success
✅ All database operations

---

## How It Works

### 1. Checkout Process

When you click "Pay via UPI" on the checkout page:
- Order is created in database
- Mock payment modal appears
- You can simulate success or failure

### 2. Mock Payment Modal

The modal shows:
- Order details (ID, amount)
- Shipping address
- Three options:
  - **✓ Simulate Success** - Completes payment successfully
  - **✗ Simulate Failure** - Simulates payment failure
  - **Cancel** - Closes modal without action

### 3. Payment Success Flow

When you click "Simulate Success":
1. Order status updated to "Paid"
2. Stock reduced from inventory
3. Cart cleared
4. Payment record created
5. Redirected to success page

### 4. Payment Failure Flow

When you click "Simulate Failure":
1. Order status updated to "Failed"
2. Stock NOT reduced
3. Cart items remain
4. Redirected to failure page

---

## Testing Scenarios

### Test Case 1: Successful Payment
1. Login as customer
2. Add products to cart
3. Go to checkout
4. Fill shipping address
5. Click "Pay via UPI"
6. Click "✓ Simulate Success"
7. **Expected:** Success page, order paid, stock reduced, cart empty

### Test Case 2: Failed Payment
1. Add products to cart
2. Go to checkout
3. Fill shipping address
4. Click "Pay via UPI"
5. Click "✗ Simulate Failure"
6. **Expected:** Failure page, order failed, stock unchanged, cart intact

### Test Case 3: Cancelled Payment
1. Add products to cart
2. Go to checkout
3. Fill shipping address
4. Click "Pay via UPI"
5. Click "Cancel"
6. **Expected:** Modal closes, can retry payment

### Test Case 4: Multiple Orders
1. Complete successful payment
2. Add new items to cart
3. Complete another payment
4. **Expected:** Both orders in admin panel

---

## Switching Between Mock and Real Razorpay

### Using Mock Payment (Current Setup)
```javascript
// checkout.html uses:
<script src="/js/checkout-mock.js"></script>
```

### Using Real Razorpay
1. Get Razorpay API keys
2. Add to `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY
```
3. Update `checkout.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script src="/js/checkout.js"></script>
```

---

## API Endpoints (Mock)

### Create Order
```
POST /api/payment-mock/create-order
Body: { shippingAddress: string }
Response: {
  success: true,
  orderId: number,
  razorpayOrderId: string,
  amount: number,
  mockMode: true
}
```

### Verify Payment
```
POST /api/payment-mock/verify-payment
Body: {
  razorpay_order_id: string,
  razorpay_payment_id: string,
  order_id: number
}
Response: {
  success: true,
  orderId: number
}
```

### Payment Failed
```
POST /api/payment-mock/payment-failed
Body: {
  order_id: number,
  error_description: string
}
Response: {
  success: true
}
```

---

## Advantages of Mock System

### For Development
- ✅ No external dependencies
- ✅ No API key setup required
- ✅ Instant testing
- ✅ No rate limits
- ✅ No network issues

### For Testing
- ✅ Test success scenarios
- ✅ Test failure scenarios
- ✅ Test edge cases
- ✅ Predictable results
- ✅ Fast iteration

### For Demos
- ✅ Works offline
- ✅ No payment gateway needed
- ✅ Professional looking
- ✅ Full flow demonstration
- ✅ Client presentations

---

## What Works in Mock Mode

✅ Order creation
✅ Stock validation
✅ Payment success handling
✅ Payment failure handling
✅ Stock reduction
✅ Cart clearing
✅ Order status updates
✅ Admin panel integration
✅ Order history
✅ All database operations

---

## What's Different from Real Razorpay

### Mock System
- No actual money transfer
- Instant payment confirmation
- Manual success/failure selection
- No UPI apps involved
- No payment gateway fees

### Real Razorpay
- Real money transfer
- Actual UPI payment
- Real payment gateway
- Integration with banks
- Transaction fees apply

---

## Troubleshooting

### Modal Not Appearing
- Check browser console for errors
- Ensure JavaScript is enabled
- Clear browser cache

### Payment Not Processing
- Check database connection
- Verify session is active
- Check server logs

### Stock Not Reducing
- Verify payment success was clicked
- Check database transactions
- Review server logs

---

## Production Deployment

When ready for production:

1. **Get Razorpay Account**
   - Sign up at razorpay.com
   - Complete KYC verification

2. **Get API Keys**
   - Generate live keys
   - Add to production `.env`

3. **Update Checkout Page**
   - Switch to real checkout.js
   - Add Razorpay script

4. **Test with Real Payments**
   - Use test mode first
   - Small test transactions
   - Verify webhook

5. **Go Live**
   - Switch to live keys
   - Monitor transactions
   - Customer support ready

---

## Quick Start

```bash
# 1. Start server
npm run dev

# 2. Login
Email: test@example.com
Password: password123

# 3. Add products to cart

# 4. Go to checkout

# 5. Fill address and click "Pay via UPI"

# 6. Click "Simulate Success" in modal

# 7. See success page!
```

---

## Notes

- Mock system is for development only
- All order data is real (stored in database)
- Stock management works correctly
- Perfect for testing and demos
- Switch to real Razorpay for production

---

## Support

For issues with mock payment:
1. Check browser console
2. Review server logs
3. Verify database connection
4. Check session status

For real Razorpay integration:
- See [PAYMENT_SETUP.md](PAYMENT_SETUP.md)
- Razorpay documentation
- Razorpay support

---

Happy Testing! 🚀
