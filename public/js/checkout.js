let cartData = null;

async function loadCartSummary() {
    try {
        const response = await fetch('/api/cart');
        
        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }
        
        cartData = await response.json();
        
        if (!cartData || cartData.items.length === 0) {
            alert('Your cart is empty');
            window.location.href = '/shop.html';
            return;
        }
        
        renderOrderSummary();
        
    } catch (error) {
        console.error('Error loading cart:', error);
        window.location.href = '/login.html';
    }
}

function renderOrderSummary() {
    const container = document.getElementById('orderItems');
    
    container.innerHTML = cartData.items.map(item => {
        const itemPrice = item.discount_price || item.price;
        const itemTotal = itemPrice * item.quantity;
        
        return `
            <div class="order-item">
                <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}">
                <div class="order-item-details">
                    <h4>${item.name}</h4>
                    <p>Size: ${item.size} | Qty: ${item.quantity}</p>
                    <p class="item-price">₹${itemTotal.toFixed(2)}</p>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('subtotal').textContent = `₹${cartData.total.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${cartData.total.toFixed(2)}`;
}

async function proceedToPayment() {
    // Validate form
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get shipping address
    const shippingAddress = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        address1: document.getElementById('address1').value,
        address2: document.getElementById('address2').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pincode: document.getElementById('pincode').value,
        country: document.getElementById('country').value
    };
    
    const addressString = `${shippingAddress.fullName}, ${shippingAddress.phone}, ${shippingAddress.address1}, ${shippingAddress.address2 ? shippingAddress.address2 + ', ' : ''}${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}, ${shippingAddress.country}`;
    
    // Disable button
    const payButton = document.getElementById('payButton');
    payButton.disabled = true;
    payButton.textContent = 'Processing...';
    
    try {
        // Create order
        const response = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shippingAddress: addressString })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to create order');
        }
        
        // Initialize Razorpay
        const options = {
            key: result.keyId,
            amount: result.amount * 100, // Amount in paise
            currency: result.currency,
            name: 'Fashion Store',
            description: 'Women\'s Fashion Purchase',
            order_id: result.razorpayOrderId,
            handler: async function (response) {
                await verifyPayment(response, result.orderId);
            },
            prefill: {
                name: shippingAddress.fullName,
                contact: shippingAddress.phone
            },
            theme: {
                color: '#d4a5a5'
            },
            method: {
                netbanking: false,
                card: false,
                wallet: false,
                upi: true,
                emi: false
            },
            modal: {
                ondismiss: function() {
                    payButton.disabled = false;
                    payButton.textContent = 'Pay via UPI';
                    handlePaymentFailure(result.orderId, 'Payment cancelled by user');
                }
            }
        };
        
        const rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function (response) {
            handlePaymentFailure(result.orderId, response.error.description);
        });
        
        rzp.open();
        
    } catch (error) {
        console.error('Payment error:', error);
        alert(error.message || 'Failed to initiate payment');
        payButton.disabled = false;
        payButton.textContent = 'Pay via UPI';
    }
}

async function verifyPayment(razorpayResponse, orderId) {
    try {
        const response = await fetch('/api/payment/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                order_id: orderId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.location.href = `/payment-success.html?orderId=${orderId}`;
        } else {
            throw new Error(result.error || 'Payment verification failed');
        }
        
    } catch (error) {
        console.error('Verification error:', error);
        window.location.href = `/payment-failed.html?orderId=${orderId}`;
    }
}

async function handlePaymentFailure(orderId, errorDescription) {
    try {
        await fetch('/api/payment/payment-failed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderId,
                error_description: errorDescription
            })
        });
        
        window.location.href = `/payment-failed.html?orderId=${orderId}`;
    } catch (error) {
        console.error('Error handling payment failure:', error);
    }
}

loadCartSummary();
