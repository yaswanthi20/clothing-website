# Razorpay UPI Payment Setup Guide

## Phase 4: UPI Payment Integration

This guide will help you set up Razorpay for UPI-only payments.

---

## Step 1: Create Razorpay Account

1. Go to [https://razorpay.com/](https://razorpay.com/)
2. Sign up for a free account
3. Complete KYC verification (for live mode)
4. For testing, you can use Test Mode immediately

---

## Step 2: Get API Keys

### Test Mode (For Development)
1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate Test Key**
4. Copy:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**

### Live Mode (For Production)
1. Complete KYC verification
2. Switch to **Live Mode** in dashboard
3. Generate Live API Keys
4. Copy:
   - **Key ID** (starts with `rzp_live_`)
   - **Key Secret**

---

## Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
# Razorpay Test Mode
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Important:** Never commit `.env` file to version control!

---

## Step 4: Install Dependencies

```bash
npm install
```

This will install:
- `razorpay` - Official Razorpay Node.js SDK
- `crypto` - For signature verification

---

## Step 5: Configure Webhook (Optional but Recommended)

Webhooks ensure payment status is updated even if user closes browser.

### Local Development (Using ngrok)
1. Install ngrok: [https://ngrok.com/](https://ngrok.com/)
2. Start your server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Configure in Razorpay Dashboard
1. Go to **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Enter webhook URL: `https://your-domain.com/api/payment/webhook`
   - For ngrok: `https://abc123.ngrok.io/api/payment/webhook`
4. Select events:
   - ✓ `payment.captured`
   - ✓ `payment.failed`
5. Copy the **Webhook Secret**
6. Add to `.env`: `RAZORPAY_WEBHOOK_SECRET=whsec_XXXXX`

---

## Step 6: Test Payment Flow

### Using Razorpay Test Mode

1. Start server: `npm run dev`
2. Login as customer: `test@example.com` / `password123`
3. Add products to cart
4. Go to checkout
5. Fill shipping address
6. Click "Pay via UPI"

### Test UPI Payments

Razorpay provides test UPI IDs:

**Successful Payment:**
- UPI ID: `success@razorpay`
- Any UPI PIN

**Failed Payment:**
- UPI ID: `failure@razorpay`
- Any UPI PIN

**Test Cards (if needed):**
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

---

## Step 7: Verify Integration

### Check Payment Success Flow:
1. ✓ Order created with status "Pending"
2. ✓ Razorpay checkout opens
3. ✓ Only UPI option visible
4. ✓ Payment completed
5. ✓ Redirected to success page
6. ✓ Order status updated to "Paid"
7. ✓ Stock reduced
8. ✓ Cart cleared
9. ✓ Order visible in admin panel

### Check Payment Failure Flow:
1. ✓ Order created with status "Pending"
2. ✓ Payment fails or cancelled
3. ✓ Redirected to failure page
4. ✓ Order status updated to "Failed"
5. ✓ Stock NOT reduced
6. ✓ Cart items remain

---

## Step 8: Security Checklist

- [x] API keys stored in environment variables
- [x] Payment signature verified on backend
- [x] Amount validated server-side
- [x] Webhook signature verified
- [x] Idempotency implemented (no double stock deduction)
- [x] HTTPS used in production
- [x] No sensitive data in frontend

---

## Step 9: Go Live

### Before Going Live:
1. Complete Razorpay KYC verification
2. Switch to Live Mode in dashboard
3. Generate Live API Keys
4. Update `.env` with live keys
5. Configure live webhook URL
6. Test with small real transaction
7. Monitor first few transactions

### Production Checklist:
- [ ] SSL certificate installed (HTTPS)
- [ ] Live API keys configured
- [ ] Webhook configured with production URL
- [ ] Error logging implemented
- [ ] Payment reconciliation process in place
- [ ] Customer support ready

---

## Troubleshooting

### Payment Not Working
1. Check API keys are correct
2. Verify `.env` file is loaded
3. Check console for errors
4. Ensure Razorpay script is loaded

### Webhook Not Receiving Events
1. Verify webhook URL is accessible
2. Check webhook secret is correct
3. Ensure HTTPS is used
4. Check Razorpay dashboard for webhook logs

### Stock Not Reducing
1. Check payment verification is successful
2. Verify database transaction completed
3. Check for errors in server logs

### Signature Verification Failed
1. Ensure Key Secret is correct
2. Check signature generation logic
3. Verify order_id matches

---

## API Endpoints

### Create Order
```
POST /api/payment/create-order
Body: { shippingAddress: "..." }
Response: { orderId, razorpayOrderId, amount, keyId }
```

### Verify Payment
```
POST /api/payment/verify-payment
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id }
Response: { success: true, orderId }
```

### Payment Failed
```
POST /api/payment/payment-failed
Body: { order_id, error_description }
Response: { success: true }
```

### Webhook
```
POST /api/payment/webhook
Headers: { x-razorpay-signature }
Body: Razorpay webhook payload
```

---

## Testing Scenarios

### Scenario 1: Successful Payment
1. Add items to cart
2. Proceed to checkout
3. Use test UPI: `success@razorpay`
4. Verify order status = "Paid"
5. Verify stock reduced
6. Verify cart cleared

### Scenario 2: Failed Payment
1. Add items to cart
2. Proceed to checkout
3. Use test UPI: `failure@razorpay`
4. Verify order status = "Failed"
5. Verify stock NOT reduced
6. Verify cart items remain

### Scenario 3: Payment Cancelled
1. Add items to cart
2. Proceed to checkout
3. Close payment modal
4. Verify order status = "Failed"
5. Verify cart items remain

### Scenario 4: Insufficient Stock
1. Add items to cart
2. Reduce stock in database
3. Try to checkout
4. Verify error message shown
5. Verify order not created

---

## Support

- Razorpay Documentation: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- Razorpay Support: [https://razorpay.com/support/](https://razorpay.com/support/)
- Test Credentials: [https://razorpay.com/docs/payments/payments/test-card-details/](https://razorpay.com/docs/payments/payments/test-card-details/)

---

## Important Notes

1. **Test Mode vs Live Mode:**
   - Test mode uses test keys (rzp_test_)
   - Live mode uses live keys (rzp_live_)
   - Never mix test and live keys

2. **UPI Only Configuration:**
   - Cards, Netbanking, Wallets are disabled
   - Only UPI Intent and UPI Collect enabled
   - Works with Google Pay, PhonePe, Paytm, etc.

3. **Security:**
   - Always verify payment signature on backend
   - Never trust frontend payment response
   - Use HTTPS in production
   - Keep API keys secret

4. **Stock Management:**
   - Stock reduced only after successful payment
   - Uses database transactions for consistency
   - Idempotent to prevent double deduction

5. **Webhook Reliability:**
   - Webhooks are more reliable than frontend callbacks
   - User can close browser, webhook still processes
   - Always implement webhook for production
