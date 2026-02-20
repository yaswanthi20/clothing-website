import db from './db.js';
import bcrypt from 'bcrypt';

async function seedDatabase() {
    try {
        console.log('Starting database seeding...');
        
        // Create test user
        const hashedPassword = await bcrypt.hash('password123', 10);
        const [userResult] = await db.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            ['Test User', 'test@example.com', '9876543210', hashedPassword, 'customer']
        );
        console.log('✓ Test user created (email: test@example.com, password: password123)');
        
        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await db.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            ['Admin User', 'admin@example.com', '9876543211', adminPassword, 'admin']
        );
        console.log('✓ Admin user created (email: admin@example.com, password: admin123)');
        
        // Get categories
        const [categories] = await db.query('SELECT * FROM categories');
        
        // Sample products
        const products = [
            {
                name: 'Floral Summer Dress',
                description: 'Beautiful floral print dress perfect for summer occasions',
                price: 2499,
                discount_price: 1999,
                category: 'Dresses',
                fabric: 'Cotton blend',
                care_instructions: 'Machine wash cold, tumble dry low'
            },
            {
                name: 'Elegant Maxi Dress',
                description: 'Long flowing maxi dress for evening wear',
                price: 3499,
                discount_price: null,
                category: 'Dresses',
                fabric: 'Polyester',
                care_instructions: 'Hand wash only, dry flat'
            },
            {
                name: 'Casual Cotton Top',
                description: 'Comfortable everyday cotton top',
                price: 899,
                discount_price: 699,
                category: 'Tops',
                fabric: '100% Cotton',
                care_instructions: 'Machine wash, iron on low heat'
            },
            {
                name: 'Designer Kurti',
                description: 'Traditional kurti with modern design',
                price: 1799,
                discount_price: 1499,
                category: 'Kurtis',
                fabric: 'Rayon',
                care_instructions: 'Dry clean recommended'
            },
            {
                name: 'Silk Saree',
                description: 'Premium silk saree for special occasions',
                price: 8999,
                discount_price: null,
                category: 'Sarees',
                fabric: 'Pure Silk',
                care_instructions: 'Dry clean only'
            },
            {
                name: 'Trendy Co-ord Set',
                description: 'Matching top and bottom set',
                price: 2299,
                discount_price: 1899,
                category: 'Co-ord Sets',
                fabric: 'Cotton blend',
                care_instructions: 'Machine wash cold'
            }
        ];
        
        for (const product of products) {
            const category = categories.find(c => c.name === product.category);
            
            const [productResult] = await db.query(
                `INSERT INTO products (name, description, price, discount_price, category_id, fabric, care_instructions) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [product.name, product.description, product.price, product.discount_price, 
                 category.id, product.fabric, product.care_instructions]
            );
            
            const productId = productResult.insertId;
            
            // Add variants (sizes with stock)
            const sizes = ['S', 'M', 'L', 'XL'];
            for (const size of sizes) {
                const stock = Math.floor(Math.random() * 20) + 5; // Random stock between 5-24
                await db.query(
                    'INSERT INTO product_variants (product_id, size, stock_quantity) VALUES (?, ?, ?)',
                    [productId, size, stock]
                );
            }
            
            // Add placeholder image
            await db.query(
                'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
                [productId, `https://via.placeholder.com/500x600?text=${encodeURIComponent(product.name)}`]
            );
            
            console.log(`✓ Created product: ${product.name}`);
        }
        
        console.log('\n✓ Database seeding completed successfully!');
        console.log('\nTest Credentials:');
        console.log('Customer - Email: test@example.com, Password: password123');
        console.log('Admin - Email: admin@example.com, Password: admin123');
        
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exit(1);
    }
}

seedDatabase();
