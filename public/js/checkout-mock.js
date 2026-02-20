let cartData = null;

async function loadCartSummary() {
    try {
        const response = await fetch('/api/cart', {
            credentials: 'include'
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Cart API returned non-JSON response');
            window.location.href = '/login.html';
            return;
        }
        
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
        alert('Please login to continue');
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
        const response = await fetch('/api/payment-mock/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shippingAddress: addressString })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to create order');
        }
        
        // Show mock payment modal
        showMockPaymentModal(result, shippingAddress);
        
        payButton.disabled = false;
        payButton.textContent = 'Pay via UPI';
        
    } catch (error) {
        console.error('Payment error:', error);
        alert(error.message || 'Failed to initiate payment');
        payButton.disabled = false;
        payButton.textContent = 'Pay via UPI';
    }
}

function showMockPaymentModal(orderData, shippingAddress) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'mock-payment-modal';
    modal.innerHTML = `
        <div class="mock-payment-content">
            <div class="mock-payment-header">
                <h2>🔒 Mock Payment Gateway</h2>
                <p style="color: #666; font-size: 0.9rem;">Development Mode - No real payment required</p>
            </div>
            
            <div class="mock-payment-body">
                <div class="payment-info-box">
                    <h3>Order Details</h3>
                    <p><strong>Order ID:</strong> #${orderData.orderId}</p>
                    <p><strong>Amount:</strong> ₹${orderData.amount.toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> UPI (Mock)</p>
                </div>
                
                <div class="payment-info-box">
                    <h3>Shipping Address</h3>
                    <p>${shippingAddress.fullName}</p>
                    <p>${shippingAddress.phone}</p>
                    <p>${shippingAddress.address1}</p>
                    ${shippingAddress.address2 ? `<p>${shippingAddress.address2}</p>` : ''}
                    <p>${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}</p>
                </div>
                
                <div class="mock-payment-options">
                    <h3>Simulate Payment Result:</h3>
                    <button onclick="simulatePaymentSuccess(${orderData.orderId}, '${orderData.razorpayOrderId}')" class="btn-success">
                        ✓ Simulate Success
                    </button>
                    <button onclick="simulatePaymentFailure(${orderData.orderId})" class="btn-failure">
                        ✗ Simulate Failure
                    </button>
                    <button onclick="closeMockModal()" class="btn-cancel">
                        Cancel
                    </button>
                </div>
                
                <div class="mock-note">
                    <p><strong>Note:</strong> This is a mock payment system for development.</p>
                    <p>Click "Simulate Success" to complete the order or "Simulate Failure" to test error handling.</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .mock-payment-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        .mock-payment-content {
            background: white;
            border-radius: 10px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        .mock-payment-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .mock-payment-header h2 {
            margin: 0 0 0.5rem 0;
        }
        .mock-payment-body {
            padding: 2rem;
        }
        .payment-info-box {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 5px;
            margin-bottom: 1rem;
        }
        .payment-info-box h3 {
            margin-top: 0;
            color: #333;
        }
        .payment-info-box p {
            margin: 0.5rem 0;
            color: #666;
        }
        .mock-payment-options {
            margin: 2rem 0;
            text-align: center;
        }
        .mock-payment-options h3 {
            margin-bottom: 1rem;
        }
        .mock-payment-options button {
            display: block;
            width: 100%;
            padding: 1rem;
            margin: 0.5rem 0;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-success {
            background: #4caf50;
            color: white;
        }
        .btn-success:hover {
            background: #45a049;
        }
        .btn-failure {
            background: #f44336;
            color: white;
        }
        .btn-failure:hover {
            background: #da190b;
        }
        .btn-cancel {
            background: #666;
            color: white;
        }
        .btn-cancel:hover {
            background: #555;
        }
        .mock-note {
            background: #fff3cd;
            padding: 1rem;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
        }
        .mock-note p {
            margin: 0.5rem 0;
            font-size: 0.9rem;
            color: #856404;
        }
    `;
    document.head.appendChild(style);
}

window.simulatePaymentSuccess = async function(orderId, razorpayOrderId) {
    const mockPaymentId = `pay_mock_${Date.now()}`;
    
    try {
        const response = await fetch('/api/payment-mock/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                razorpay_order_id: razorpayOrderId,
                razorpay_payment_id: mockPaymentId,
                order_id: orderId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeMockModal();
            window.location.href = `/payment-success.html?orderId=${orderId}`;
        } else {
            throw new Error(result.error || 'Payment verification failed');
        }
        
    } catch (error) {
        console.error('Verification error:', error);
        alert('Payment verification failed: ' + error.message);
    }
};

window.simulatePaymentFailure = async function(orderId) {
    try {
        await fetch('/api/payment-mock/payment-failed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderId,
                error_description: 'Payment cancelled by user (simulated)'
            })
        });
        
        closeMockModal();
        window.location.href = `/payment-failed.html?orderId=${orderId}`;
    } catch (error) {
        console.error('Error handling payment failure:', error);
    }
};

window.closeMockModal = function() {
    const modal = document.querySelector('.mock-payment-modal');
    if (modal) {
        modal.remove();
    }
};

loadCartSummary();
