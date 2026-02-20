async function loadCategories() {
    try {
        const response = await fetch('/api/admin/categories');
        const categories = await response.json();
        
        const tbody = document.getElementById('categoriesTable');
        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td>${cat.name}</td>
                <td>${cat.product_count}</td>
                <td>${new Date(cat.created_at).toLocaleDateString()}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-primary" onclick="editCategory(${cat.id}, '${cat.name}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.id}, ${cat.product_count})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModal').classList.add('active');
}

function editCategory(id, name) {
    document.getElementById('modalTitle').textContent = 'Edit Category';
    document.getElementById('categoryId').value = id;
    document.getElementById('categoryName').value = name;
    document.getElementById('categoryModal').classList.add('active');
}

function closeModal() {
    document.getElementById('categoryModal').classList.remove('active');
}

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value;
    
    try {
        const url = id ? `/api/admin/categories/${id}` : '/api/admin/categories';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            closeModal();
            loadCategories();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error saving category:', error);
        alert('Failed to save category');
    }
});

async function deleteCategory(id, productCount) {
    if (productCount > 0) {
        alert(`Cannot delete category with ${productCount} products. Please reassign or delete products first.`);
        return;
    }
    
    if (!confirm('Are you sure you want to delete this category?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/categories/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadCategories();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category');
    }
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
}

loadCategories();
