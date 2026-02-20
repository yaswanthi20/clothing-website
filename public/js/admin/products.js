let categories = [];
let currentImages = [];
let editingProductId = null;

async function loadCategories() {
    try {
        const response = await fetch('/api/admin/categories');
        categories = await response.json();
        
        const categoryFilter = document.getElementById('categoryFilter');
        const productCategory = document.getElementById('productCategory');
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        
        productCategory.innerHTML = '<option value="">Select Category</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProducts() {
    try {
        const search = document.getElementById('searchInput').value;
        const category = document.getElementById('categoryFilter').value;
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        
        const response = await fetch(`/api/admin/products?${params}`);
        const products = await response.json();
        
        const tbody = document.getElementById('productsTable');
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No products found</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.category_name}</td>
                <td>₹${product.price}</td>
                <td>${product.discount_price ? '₹' + product.discount_price : '-'}</td>
                <td>
                    <span class="badge ${product.total_stock < 5 ? 'badge-danger' : 'badge-success'}">
                        ${product.total_stock || 0}
                    </span>
                </td>
                <td>${product.image_count}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="manageStock(${product.id})">Stock</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function openAddProductModal() {
    editingProductId = null;
    currentImages = [];
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imagesList').innerHTML = '';
    document.getElementById('imageFiles').value = '';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

async function uploadProductImages() {
    const fileInput = document.getElementById('imageFiles');
    const files = fileInput.files;
    
    if (!files || files.length === 0) {
        alert('Please select at least one image file');
        return;
    }
    
    // Validation
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    for (let file of files) {
        if (file.size > maxSize) {
            alert(`File "${file.name}" is too large. Maximum size is 2MB.`);
            return;
        }
        if (!allowedTypes.includes(file.type)) {
            alert(`File "${file.name}" is not a supported image type. Use JPG, JPEG, PNG, or WEBP.`);
            return;
        }
    }
    
    if (files.length > 5) {
        alert('Maximum 5 images allowed at once');
        return;
    }
    
    // Show progress
    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressDiv.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.textContent = '';
    progressText.textContent = 'Preparing upload...';
    
    try {
        // Use temp product ID for new products
        const productId = editingProductId || 'temp';
        
        // Upload each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('image', file);
            formData.append('productId', productId);
            
            const percent = Math.round(((i + 1) / files.length) * 100);
            progressBar.style.width = percent + '%';
            progressBar.textContent = percent + '%';
            progressText.textContent = `Uploading ${i + 1} of ${files.length}: ${file.name}`;
            
            const response = await fetch('/api/upload/product-image', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
            
            const result = await response.json();
            currentImages.push({ 
                url: result.imageUrl,
                filename: result.filename,
                size: result.size
            });
        }
        
        // Complete
        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
        progressText.textContent = `✓ ${files.length} image(s) uploaded successfully!`;
        progressText.style.color = '#4CAF50';
        
        // Clear file input and render images
        fileInput.value = '';
        renderImagesList();
        
        // Hide progress after 3 seconds
        setTimeout(() => {
            progressDiv.style.display = 'none';
            progressBar.style.width = '0%';
            progressBar.textContent = '';
            progressText.style.color = '#666';
        }, 3000);
        
    } catch (error) {
        console.error('Upload error:', error);
        progressBar.style.width = '100%';
        progressBar.style.background = '#f44336';
        progressBar.textContent = 'Failed';
        progressText.textContent = '✗ Upload failed: ' + error.message;
        progressText.style.color = '#f44336';
        
        setTimeout(() => {
            progressDiv.style.display = 'none';
            progressBar.style.width = '0%';
            progressBar.style.background = 'linear-gradient(90deg, #4CAF50, #45a049)';
            progressBar.textContent = '';
            progressText.style.color = '#666';
        }, 5000);
    }
}

function renderImagesList() {
    const container = document.getElementById('imagesList');
    
    if (currentImages.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 0.9rem;">No images uploaded yet</p>';
        return;
    }
    
    container.innerHTML = currentImages.map((img, index) => {
        const sizeKB = img.size ? Math.round(img.size / 1024) : 0;
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid #4CAF50;">
                <div style="flex: 1;">
                    <div style="font-size: 0.9rem; font-weight: 500; color: #333;">${img.filename || 'Image ' + (index + 1)}</div>
                    <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">
                        ${img.url} ${sizeKB > 0 ? '• ' + sizeKB + ' KB' : ''}
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeImage(${index})" style="margin-left: 10px;">
                    🗑️ Remove
                </button>
            </div>
        `;
    }).join('');
}

function removeImage(index) {
    if (confirm('Remove this image?')) {
        currentImages.splice(index, 1);
        renderImagesList();
    }
}

async function editProduct(id) {
    try {
        const response = await fetch(`/api/admin/products/${id}`);
        const product = await response.json();
        
        editingProductId = id;
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.category_id;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDiscountPrice').value = product.discount_price || '';
        document.getElementById('productFabric').value = product.fabric || '';
        document.getElementById('productCare').value = product.care_instructions || '';
        
        // Set stock values
        product.variants.forEach(variant => {
            const input = document.getElementById(`stock${variant.size}`);
            if (input) input.value = variant.stock_quantity;
        });
        
        // Set images
        currentImages = product.images.map(img => ({
            url: img.image_url,
            filename: img.image_url.split('/').pop(),
            id: img.id
        }));
        renderImagesList();
        
        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Failed to load product details');
    }
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        discount_price: document.getElementById('productDiscountPrice').value ? 
            parseFloat(document.getElementById('productDiscountPrice').value) : null,
        category_id: parseInt(document.getElementById('productCategory').value),
        fabric: document.getElementById('productFabric').value,
        care_instructions: document.getElementById('productCare').value,
        variants: [
            { size: 'S', stock_quantity: parseInt(document.getElementById('stockS').value) || 0 },
            { size: 'M', stock_quantity: parseInt(document.getElementById('stockM').value) || 0 },
            { size: 'L', stock_quantity: parseInt(document.getElementById('stockL').value) || 0 },
            { size: 'XL', stock_quantity: parseInt(document.getElementById('stockXL').value) || 0 }
        ],
        images: currentImages
    };
    
    console.log('Submitting product data:', productData);
    console.log('Images array:', currentImages);
    console.log('Images count:', currentImages.length);
    
    try {
        let response;
        if (editingProductId) {
            response = await fetch(`/api/admin/products/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            closeProductModal();
            loadProducts();
        } else {
            alert(result.error || 'Failed to save product');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Failed to save product');
    }
});

async function manageStock(id) {
    try {
        const response = await fetch(`/api/admin/products/${id}`);
        const product = await response.json();
        
        const stockData = product.variants.map(v => 
            `${v.size}: ${prompt(`Enter stock for size ${v.size}:`, v.stock_quantity) || v.stock_quantity}`
        );
        
        const variants = product.variants.map((v, i) => ({
            size: v.size,
            stock_quantity: parseInt(stockData[i].split(': ')[1])
        }));
        
        const updateResponse = await fetch(`/api/admin/products/${id}/stock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variants })
        });
        
        const result = await updateResponse.json();
        
        if (updateResponse.ok) {
            alert(result.message);
            loadProducts();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error updating stock:', error);
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadProducts();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
    }
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
}

loadCategories();
loadProducts();
