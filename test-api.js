// Test what the products API actually returns
import db from './database/db.js';

async function testProductsAPI() {
    try {
        console.log('\n=== Testing Products API Query ===\n');
        
        const query = `
            SELECT p.*, c.name as category_name,
            (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as image,
            (SELECT SUM(stock_quantity) FROM product_variants WHERE product_id = p.id) as total_stock
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE EXISTS (SELECT 1 FROM product_variants WHERE product_id = p.id AND stock_quantity > 0)
            ORDER BY p.created_at DESC
        `;
        
        const [products] = await db.query(query);
        
        console.log('Total products:', products.length);
        console.log('\nSample product (first one):');
        console.log(JSON.stringify(products[0], null, 2));
        
        console.log('\nProducts with images:');
        products.forEach(p => {
            if (p.image) {
                console.log(`- Product ${p.id} (${p.name}): ${p.image}`);
            }
        });
        
        console.log('\nProducts WITHOUT images:');
        products.forEach(p => {
            if (!p.image) {
                console.log(`- Product ${p.id} (${p.name}): NO IMAGE`);
            }
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testProductsAPI();
