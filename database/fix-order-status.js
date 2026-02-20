import db from './db.js';

async function fixOrderStatus() {
    try {
        console.log('Fixing order_status ENUM to include Pending...\n');
        
        // Alter the orders table to add 'Pending' to order_status ENUM
        await db.query(`
            ALTER TABLE orders 
            MODIFY COLUMN order_status ENUM('Pending', 'Processing', 'Shipped', 'Delivered') DEFAULT 'Pending'
        `);
        
        console.log('✓ Successfully updated order_status ENUM');
        console.log('  Added: Pending');
        console.log('  Existing: Processing, Shipped, Delivered');
        console.log('\nYou can now use all order statuses!');
        
        process.exit(0);
    } catch (error) {
        console.error('Error fixing order_status:', error.message);
        process.exit(1);
    }
}

fixOrderStatus();
