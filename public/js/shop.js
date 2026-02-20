// Load categories for filter
async function loadCategoryFilter() {
    try {
        const response = await fetch('/api/products/categories/all');
        const categories = await response.json();
        
        const select = document.getElementById('categoryFilter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load products
async function loadProducts() {
    const params = new URLSearchParams(window.location.search);
    const queryString = params.toString();
    
    try {
        const response = await fetch(`/api/products?${queryString}`);
        const products = await response.json();
        
        const container = document.getElementById('products');
        if (products.length === 0) {
            container.innerHTML = '<p>No products found</p>';
            return;
        }
        
        container.innerHTML = products.map(product => `
            <div class="product-card" onclick="window.location.href='/product.html?id=${product.id}'">
                <img src="${product.image || '/images/placeholder.jpg'}" alt="${product.name}">
                <div class="product-card-content">
                    <h3>${product.name}</h3>
                    <p>${product.category_name}</p>
                    <div>
                        <span class="price">₹${product.discount_price || product.price}</span>
                        ${product.discount_price ? `<span class="discount-price">₹${product.price}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const size = document.getElementById('sizeFilter').value;
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    const sort = document.getElementById('sortFilter').value;
    
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (size) params.append('size', size);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (sort) params.append('sort', sort);
    
    window.location.search = params.toString();
}

loadCategoryFilter();
loadProducts();
