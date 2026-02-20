async function loadOrders() {
    try {
        const search = document.getElementById('searchInput').value;
        const paymentStatus = document.getElementById('paymentStatusFilter').value;
        const orderStatus = document.getElementById('orderStatusFilter').value;
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (paymentStatus) params.append('payment_status', paymentStatus);
        if (orderStatus) params.append('order_status', orderStatus);
        
        const response = await fetch(`/api/admin/orders?${params}`);
        const orders = await response.json();
        
        const tbody = document.getElementById('ordersTable');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No orders found</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>
                    <div>${order.customer_name}</div>
                    <small style="color: #6c757d;">${order.email}</small>
                </td>
                <td>${order.item_count}</td>
                <td>₹${order.total_amount}</td>
                <td><span class="badge badge-${getPaymentBadge(order.payment_status)}">${order.payment_status}</span></td>
                <td><span class="badge badge-${getOrderBadge(order.order_status)}">${order.order_status}</span></td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})">View</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function viewOrder(id) {
    try {
        const response = await fetch(`/api/admin/orders/${id}`);
        const order = await response.json();
        
        const detailsHtml = `
            <div style="margin-bottom: 2rem;">
                <h3>Order #${order.id}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div>
                        <strong>Customer:</strong> ${order.customer_name}<br>
                        <strong>Email:</strong> ${order.email}<br>
                        <strong>Phone:</strong> ${order.phone || 'N/A'}
                    </div>
                    <div>
                        <strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}<br>
                        <strong>Total Amount:</strong> ₹${order.total_amount}
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 2rem;">
                <h4>Shipping Address</h4>
                <p>${order.shipping_address}</p>
            </div>

            <div style="margin-bottom: 2rem;">
                <h4>Payment Information</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <strong>Payment Status:</strong> 
                        <span class="badge badge-${getPaymentBadge(order.payment_status)}">${order.payment_status}</span>
                    </div>
                    <div>
                        <strong>Payment Method:</strong> ${order.payment_method || 'UPI'}
                    </div>
                    ${order.transaction_id ? `
                        <div>
                            <strong>Transaction ID:</strong> ${order.transaction_id}
                        </div>
                    ` : ''}
                </div>
                ${order.payment_status !== 'Paid' ? `
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-success btn-sm" onclick="updatePaymentStatus(${order.id}, 'Paid')">Mark as Paid</button>
                        <button class="btn btn-danger btn-sm" onclick="updatePaymentStatus(${order.id}, 'Failed')">Mark as Failed</button>
                    </div>
                ` : ''}
            </div>

            <div style="margin-bottom: 2rem;">
                <h4>Order Status</h4>
                <p>
                    <span class="badge badge-${getOrderBadge(order.order_status)}">${order.order_status}</span>
                </p>
                ${getStatusUpdateButtons(order.id, order.order_status)}
            </div>

            <div style="margin-bottom: 2rem;">
                <h4>Order Items</h4>
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Size</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.size}</td>
                                <td>${item.quantity}</td>
                                <td>₹${item.price}</td>
                                <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('orderDetails').innerHTML = detailsHtml;
        document.getElementById('orderModal').classList.add('active');
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Failed to load order details');
    }
}

function getStatusUpdateButtons(orderId, currentStatus) {
    const transitions = {
        'Pending': 'Processing',
        'Processing': 'Shipped',
        'Shipped': 'Delivered',
        'Delivered': null
    };
    
    const nextStatus = transitions[currentStatus];
    
    if (!nextStatus) {
        return '<p style="color: #28a745;">Order completed</p>';
    }
    
    return `
        <button class="btn btn-primary btn-sm" onclick="updateOrderStatus(${orderId}, '${nextStatus}')">
            Update to ${nextStatus}
        </button>
    `;
}

async function updateOrderStatus(orderId, newStatus) {
    if (!confirm(`Update order status to ${newStatus}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_status: newStatus })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            closeOrderModal();
            loadOrders();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status');
    }
}

async function updatePaymentStatus(orderId, newStatus) {
    const transactionId = newStatus === 'Paid' ? 
        prompt('Enter transaction ID (optional):') : null;
    
    if (!confirm(`Update payment status to ${newStatus}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/payment`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                payment_status: newStatus,
                transaction_id: transactionId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message + (result.stockReduced ? '\nStock has been reduced.' : ''));
            closeOrderModal();
            loadOrders();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error updating payment status:', error);
        alert('Failed to update payment status');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

function getPaymentBadge(status) {
    const badges = {
        'Paid': 'success',
        'Pending': 'warning',
        'Failed': 'danger'
    };
    return badges[status] || 'secondary';
}

function getOrderBadge(status) {
    const badges = {
        'Pending': 'secondary',
        'Processing': 'info',
        'Shipped': 'warning',
        'Delivered': 'success'
    };
    return badges[status] || 'secondary';
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
}

loadOrders();
