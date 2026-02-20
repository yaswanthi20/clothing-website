import db from './db.js';

async function updateProductImages() {
    try {
        console.log('Updating product images...\n');
        
        // Check if we have any products
        const [products] = await db.query('SELECT id, name FROM products');
        
        if (products.length === 0) {
            console.log('No products found. Please run: npm run db:seed');
            process.exit(1);
        }
        
        console.log(`Found ${products.length} products\n`);
        
        // Find Anarkali or Kurti products
        const anarkaliProduct = products.find(p => 
            p.name.toLowerCase().includes('kurti') || 
            p.name.toLowerCase().includes('anarkali')
        );
        
        if (anarkaliProduct) {
            // Update the image for this product
            await db.query(
                'UPDATE product_images SET image_url = ? WHERE product_id = ?',
                ['/images/anarkali-kurta-.jpg', anarkaliProduct.id]
            );
            
            console.log(`✓ Updated image for: ${anarkaliProduct.name}`);
            console.log(`  Image: /images/anarkali-kurta-.jpg`);
        } else {
            console.log('⚠ No Kurti/Anarkali product found');
            console.log('\nAvailable products:');
            products.forEach(p => console.log(`  - ${p.name}`));
        }
        
        // Show all current product images
        console.log('\n' + '='.repeat(60));
        console.log('Current Product Images:');
        console.log('='.repeat(60));
        
        const [productImages] = await db.query(`
            SELECT p.id, p.name, pi.image_url
            FROM products p
            LEFT JOIN product_images pi ON pi.product_id = p.id
            ORDER BY p.id
        `);
        
        productImages.forEach(item => {
            console.log(`\n${item.name}:`);
            console.log(`  Image: ${item.image_url || 'No image'}`);
        });
        
        console.log('\n✓ Image update complete!');
        process.exit(0);
        
    } catch (error) {
        console.error('Error updating images:', error.message);
        process.exit(1);
    }
}

updateProductImages();
