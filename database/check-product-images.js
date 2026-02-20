import db from './db.js';

async function checkProductImages() {
    try {
        console.log('\n=== Checking Product Images ===\n');
        
        // Get all products with their images
        const [products] = await db.query(`
            SELECT p.id, p.name, 
                   COUNT(pi.id) as image_count
            FROM products p
            LEFT JOIN product_images pi ON pi.product_id = p.id
            GROUP BY p.id
            ORDER BY p.id
        `);
        
        console.log('Products and Image Count:');
        console.table(products);
        
        // Get detailed image information
        const [images] = await db.query(`
            SELECT pi.id, pi.product_id, pi.image_url, p.name as product_name
            FROM product_images pi
            JOIN products p ON p.id = pi.product_id
            ORDER BY pi.product_id, pi.id
        `);
        
        console.log('\nDetailed Image Records:');
        if (images.length === 0) {
            console.log('❌ No images found in database!');
        } else {
            console.table(images);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProductImages();
