let selectedSize = null;
let currentProduct = null;

async function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    
    if (!productId) {
        window.location.href = '/shop.html';
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${productId}`);
        currentProduct = await response.json();
        
        document.getElementById('productName').textContent = currentProduct.name;
        
        const finalPrice = currentProduct.discount_price || currentProduct.price;
        document.getElementById('price').textContent = `₹${finalPrice}`;
        
        if (currentProduct.discount_price) {
            document.getElementById('discountPrice').textContent = `₹${currentProduct.price}`;
            document.getElementById('discountPrice').style.display = 'inline';
        } else {
            document.getElementById('discountPrice').style.display = 'none';
        }
        
        document.getElementById('description').textContent = currentProduct.description || 'No description available';
        document.getElementById('fabric').textContent = currentProduct.fabric || 'N/A';
        document.getElementById('care').textContent = currentProduct.care_instructions || 'N/A';
        
        // Load images
        const carousel = document.getElementById('imageCarousel');
        if (currentProduct.images && currentProduct.images.length > 0) {
            let currentImageIndex = 0;
            
            const renderImage = () => {
                carousel.innerHTML = `
                    <div style="position: relative; width: 100%;">
                        <img src="${currentProduct.images[currentImageIndex].image_url}" 
                             alt="${currentProduct.name}"
                             style="width: 100%; border-radius: 10px;">
                        ${currentProduct.images.length > 1 ? `
                            <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px;">
                                <button onclick="previousImage()" style="background: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">‹</button>
                                <span style="background: white; padding: 10px 15px; border-radius: 5px;">${currentImageIndex + 1} / ${currentProduct.images.length}</span>
                                <button onclick="nextImage()" style="background: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">›</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            };
            
            window.nextImage = () => {
                currentImageIndex = (currentImageIndex + 1) % currentProduct.images.length;
                renderImage();
            };
            
            window.previousImage = () => {
                currentImageIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
                renderImage();
            };
            
            renderImage();
        } else {
            carousel.innerHTML = '<p style="text-align: center; padding: 50px;">No image available</p>';
        }
        
        // Load sizes
        const sizeOptions = document.getElementById('sizeOptions');
        if (currentProduct.variants && currentProduct.variants.length > 0) {
            sizeOptions.innerHTML = currentProduct.variants.map(variant => {
                const isOutOfStock = variant.stock_quantity === 0;
                return `
                    <div class="size-option ${isOutOfStock ? 'out-of-stock' : ''}" 
                         onclick="${isOutOfStock ? '' : `selectSize('${variant.size}', ${variant.stock_quantity})`}"
                         data-size="${variant.size}"
                         style="${isOutOfStock ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                        ${variant.size}
                        ${isOutOfStock ? '<br><small>Out of Stock</small>' : ''}
                    </div>
                `;
            }).join('');
        } else {
            sizeOptions.innerHTML = '<p>No sizes available</p>';
        }
        
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Error loading product details');
    }
}

function selectSize(size, stock) {
    selectedSize = size;
    document.querySelectorAll('.size-option').forEach(el => {
        el.classList.remove('selected');
    });
    const selectedEl = document.querySelector(`[data-size="${size}"]`);
    if (selectedEl) {
        selectedEl.classList.add('selected');
    }
}

async function addToCart() {
    if (!selectedSize) {
        showMessage('Please select a size', 'error');
        return;
    }
    
    // Show loading state
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: currentProduct.id,
                size: selectedSize,
                quantity: 1
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showMessage('Added to cart!', 'success');
            setTimeout(() => {
                const goToCart = confirm('Item added to cart! Go to cart?');
                if (goToCart) {
                    window.location.href = '/cart.html';
                }
            }, 500);
        } else if (result.requireLogin) {
            showMessage('Please login to add items to cart', 'error');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        } else if (result.error) {
            showMessage(result.error, 'error');
            if (result.available !== undefined) {
                showMessage(`Only ${result.available} items available`, 'error');
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showMessage('Please login to add items to cart', 'error');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function showMessage(message, type) {
    // Remove existing messages
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

// Add CSS animations
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
`;
document.head.appendChild(style);

loadProduct();
