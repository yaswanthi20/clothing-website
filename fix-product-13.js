import fs from 'fs';
import path from 'path';
import db from './database/db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixProduct13() {
    try {
        console.log('\n=== Fixing Product 13 Image ===\n');
        
        // Get current image path
        const [images] = await db.query('SELECT * FROM product_images WHERE product_id = 13');
        
        if (images.length === 0) {
            console.log('No images found for product 13');
            process.exit(0);
        }
        
        console.log('Current image record:', images[0]);
        
        const oldUrl = images[0].image_url;
        const oldPath = path.join(__dirname, 'public/images/products/temp/temp_1771221757105_812337.png');
        
        console.log('\nOld file path:', oldPath);
        console.log('File exists?', fs.existsSync(oldPath));
        
        if (!fs.existsSync(oldPath)) {
            console.log('✗ File not found!');
            process.exit(1);
        }
        
        // Create new folder
        const newFolder = path.join(__dirname, 'public/images/products/13');
        if (!fs.existsSync(newFolder)) {
            fs.mkdirSync(newFolder, { recursive: true });
            console.log('✓ Created folder:', newFolder);
        }
        
        // Move file
        const newFilename = '13_1771221757105_812337.png';
        const newPath = path.join(newFolder, newFilename);
        const newUrl = `/images/products/13/${newFilename}`;
        
        console.log('\nNew file path:', newPath);
        console.log('New URL:', newUrl);
        
        fs.renameSync(oldPath, newPath);
        console.log('✓ File moved successfully');
        
        // Update database
        await db.query(
            'UPDATE product_images SET image_url = ? WHERE id = ?',
            [newUrl, images[0].id]
        );
        console.log('✓ Database updated');
        
        console.log('\n=== Fix Complete ===');
        console.log('Product 13 image should now display correctly');
        console.log('Check: http://localhost:3000/shop.html\n');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixProduct13();
