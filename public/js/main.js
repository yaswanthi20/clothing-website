// Load new arrivals
async function loadNewArrivals() {
    try {
        const response = await fetch('/api/products?sort=latest');
        const products = await response.json();
        
        const container = document.getElementById('newArrivals');
        container.innerHTML = products.slice(0, 4).map(product => `
            <div class="product-card" onclick="window.location.href='/product.html?id=${product.id}'">
                <img src="${product.image || '/images/placeholder.jpg'}" alt="${product.name}">
                <div class="product-card-content">
                    <h3>${product.name}</h3>
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

// Load categories
async function loadCategories() {
    try {
        const response = await fetch('/api/products/categories/all');
        const categories = await response.json();
        
        const container = document.getElementById('categories');
        container.innerHTML = categories.map(category => `
            <div class="category-card" onclick="window.location.href='/shop.html?category=${category.name}'">
                <h3>${category.name}</h3>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

loadNewArrivals();
loadCategories();
