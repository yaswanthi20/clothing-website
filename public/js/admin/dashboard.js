// Check admin authentication
async function checkAuth() {
    // This will be handled by session on backend
    // If not admin, backend will return 403
}

async function loadDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard/stats');
        
        if (response.status === 403) {
            alert('Admin access required');
            window.location.href = '/login.html';
            return;
        }
        
        const data = await response.json();
        
        document.getElementById('totalProducts').textContent = data.totalProducts;
        document.getElementById('totalOrders').textContent = data.totalOrders;
        document.getElementById('totalRevenue').textContent = `₹${parseFloat(data.totalRevenue).toFixed(2)}`;
        document.getElementById('pendingOrders').textContent = data.pendingOrders;
        
        // Low stock alert
        const alertBox = document.getElementById('lowStockAlert');
        if (data.lowStockItems > 0) {
            alertBox.innerHTML = `⚠️ ${data.lowStockItems} product variant(s) have low stock (less than 5 units)`;
            alertBox.className = 'alert-box';
        } else {
            alertBox.innerHTML = '✓ All products have sufficient stock';
            alertBox.className = 'alert-box empty';
        }
        
        // Recent orders
        const tbody = document.getElementById('recentOrders');
        if (data.recentOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders yet</td></tr>';
        } else {
            tbody.innerHTML = data.recentOrders.map(order => `
                <tr onclick="window.location.href='/admin/orders.html?id=${order.id}'" style="cursor: pointer;">
                    <td>#${order.id}</td>
                    <td>${order.customer_name}</td>
                    <td>₹${order.total_amount}</td>
                    <td><span class="badge badge-${getPaymentBadge(order.payment_status)}">${order.payment_status}</span></td>
                    <td><span class="badge badge-${getOrderBadge(order.order_status)}">${order.order_status}</span></td>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        if (error.message.includes('403')) {
            window.location.href = '/login.html';
        }
    }
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
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

loadDashboard();
