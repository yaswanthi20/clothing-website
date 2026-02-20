let cartData = null;

async function loadCart() {
    try {
        const response = await fetch('/api/cart');
        
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        
        cartData = await response.json();
        renderCart();
        
    } catch (error) {
        console.error('Error loading cart:', error);
        document.getElementById('cartItems').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p>Please login to view your cart</p>
                <a href="/login.html" class="btn-primary" style="margin-top: 20px;">Login</a>
            </div>
        `;
        document.getElementById('subtotal').textContent = '₹0';
    }
}

function renderCart() {
    const container = document.getElementById('cartItems');
    
    if (!cartData || cartData.items.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="font-size: 1.2rem; margin-bottom: 20px;">Your cart is empty</p>
                <a href="/shop.html" class="btn-primary">Continue Shopping</a>
            </div>
        `;
        document.getElementById('subtotal').textContent = '₹0';
        document.querySelector('.cart-summary button').disabled = true;
        return;
    }
    
    container.innerHTML = cartData.items.map(item => {
        const itemPrice = item.discount_price || item.price;
        const itemTotal = itemPrice * item.quantity;
        const maxStock = item.stock_quantity;
        
        return `
            <div class="cart-item" data-item-id="${item.id}">
                <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p>Size: ${item.size}</p>
                    <p class="item-price">₹${itemPrice} each</p>
                    <p class="item-total">Subtotal: ₹${itemTotal.toFixed(2)}</p>
                    ${item.quantity >= maxStock ? `<p style="color: #f44336; font-size: 0.9rem;">Max stock reached</p>` : ''}
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${item.id}, ${item.quantity - 1}, ${maxStock})" 
                                ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, ${item.quantity + 1}, ${maxStock})"
                                ${item.quantity >= maxStock ? 'disabled' : ''}>+</button>
                    </div>
                    <button onclick="removeItem(${item.id})" class="btn-remove">Remove</button>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('subtotal').textContent = `₹${cartData.total.toFixed(2)}`;
    document.querySelector('.cart-summary button').disabled = false;
}

async function updateQuantity(itemId, newQuantity, maxStock) {
    if (newQuantity < 1) {
        showMessage('Quantity cannot be less than 1', 'error');
        return;
    }
    
    if (newQuantity > maxStock) {
        showMessage(`Only ${maxStock} items available in stock`, 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/cart/update/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQuantity })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            await loadCart();
            showMessage('Cart updated', 'success');
        } else {
            showMessage(result.error || 'Failed to update cart', 'error');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showMessage('Failed to update cart', 'error');
    }
}

async function removeItem(itemId) {
    if (!confirm('Remove this item from cart?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/cart/remove/${itemId}`, { 
            method: 'DELETE' 
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            await loadCart();
            showMessage('Item removed from cart', 'success');
        } else {
            showMessage(result.error || 'Failed to remove item', 'error');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showMessage('Failed to remove item', 'error');
    }
}

async function proceedToCheckout() {
    // Validate cart before checkout
    try {
        const response = await fetch('/api/cart/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (!result.valid) {
            if (result.stockIssues && result.stockIssues.length > 0) {
                let message = 'Stock issues found:\n\n';
                result.stockIssues.forEach(issue => {
                    message += `${issue.productName} (${issue.size}): Requested ${issue.requested}, Available ${issue.available}\n`;
                });
                alert(message);
                await loadCart(); // Refresh cart to show updated stock
            } else {
                alert(result.error || 'Cannot proceed to checkout');
            }
            return;
        }
        
        // Redirect to checkout page
        window.location.href = '/checkout.html';
        
    } catch (error) {
        console.error('Error during checkout:', error);
        showMessage('Failed to proceed to checkout', 'error');
    }
}

function showMessage(message, type) {
    const existing = document.querySelector('.message-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'message-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    .cart-item-details {
        flex: 1;
    }
    .cart-item-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-end;
    }
    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #f5f5f5;
        padding: 5px;
        border-radius: 5px;
    }
    .quantity-controls button {
        width: 30px;
        height: 30px;
        border: none;
        background: #d4a5a5;
        color: white;
        border-radius: 3px;
        cursor: pointer;
        font-size: 1.2rem;
    }
    .quantity-controls button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
    .quantity-display {
        min-width: 30px;
        text-align: center;
        font-weight: bold;
    }
    .btn-remove {
        background: #f44336;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
    }
    .btn-remove:hover {
        background: #d32f2f;
    }
    .item-price {
        color: #666;
        font-size: 0.9rem;
    }
    .item-total {
        color: #d4a5a5;
        font-weight: bold;
        margin-top: 5px;
    }
`;
document.head.appendChild(style);

loadCart();
