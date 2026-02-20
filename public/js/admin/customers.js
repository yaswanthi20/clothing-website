async function loadCustomers() {
    try {
        const search = document.getElementById('searchInput').value;
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        
        const response = await fetch(`/api/admin/customers?${params}`);
        const customers = await response.json();
        
        const tbody = document.getElementById('customersTable');
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No customers found</td></tr>';
            return;
        }
        
        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>${customer.order_count}</td>
                <td>₹${parseFloat(customer.total_spent || 0).toFixed(2)}</td>
                <td>${new Date(customer.created_at).toLocaleDateString()}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-primary" onclick="viewCustomer(${customer.id})">View</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

async function viewCustomer(id) {
    try {
        const [customerResponse, ordersResponse] = await Promise.all([
            fetch(`/api/admin/customers/${id}`),
            fetch(`/api/admin/customers/${id}/orders`)
        ]);
        
        const customer = await customerResponse.json();
        const orders = await ordersResponse.json();
        
        const detailsHtml = `
            <div style="margin-bottom: 2rem;">
                <h3>${customer.name}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div>
                        <strong>Email:</strong> ${customer.email}<br>
                        <strong>Phone:</strong> ${customer.phone || 'N/A'}<br>
                        <strong>Member Since:</strong> ${new Date(customer.created_at).toLocaleDateString()}
                    </div>
                    <div>
                        <strong>Total Orders:</strong> ${customer.order_count}<br>
                        <strong>Total Spent:</strong> ₹${parseFloat(customer.total_spent || 0).toFixed(2)}
                    </div>
                </div>
            </div>

            <div>
                <h4>Order History</h4>
                ${orders.length === 0 ? '<p>No orders yet</p>' : `
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(order => `
                                <tr>
                                    <td>#${order.id}</td>
                                    <td>${order.item_count}</td>
                                    <td>₹${order.total_amount}</td>
                                    <td><span class="badge badge-${getPaymentBadge(order.payment_status)}">${order.payment_status}</span></td>
                                    <td><span class="badge badge-${getOrderBadge(order.order_status)}">${order.order_status}</span></td>
                                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        `;
        
        document.getElementById('customerDetails').innerHTML = detailsHtml;
        document.getElementById('customerModal').classList.add('active');
    } catch (error) {
        console.error('Error loading customer details:', error);
        alert('Failed to load customer details');
    }
}

function closeModal() {
    document.getElementById('customerModal').classList.remove('active');
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

loadCustomers();
