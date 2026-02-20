import db from './db.js';
import bcrypt from 'bcrypt';

async function checkAndCreateAdmin() {
    try {
        console.log('Checking for admin user...\n');
        
        // Check if admin exists
        const [admins] = await db.query(
            "SELECT id, name, email, role FROM users WHERE email = 'admin@example.com'"
        );
        
        if (admins.length > 0) {
            console.log('✓ Admin user found:');
            console.log('  ID:', admins[0].id);
            console.log('  Name:', admins[0].name);
            console.log('  Email:', admins[0].email);
            console.log('  Role:', admins[0].role);
            console.log('\nCredentials:');
            console.log('  Email: admin@example.com');
            console.log('  Password: admin123');
        } else {
            console.log('✗ Admin user not found. Creating...\n');
            
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const [result] = await db.query(
                'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
                ['Admin User', 'admin@example.com', '9876543211', hashedPassword, 'admin']
            );
            
            console.log('✓ Admin user created successfully!');
            console.log('  ID:', result.insertId);
            console.log('\nCredentials:');
            console.log('  Email: admin@example.com');
            console.log('  Password: admin123');
        }
        
        // Also check test user
        console.log('\n---\n');
        const [testUsers] = await db.query(
            "SELECT id, name, email, role FROM users WHERE email = 'test@example.com'"
        );
        
        if (testUsers.length > 0) {
            console.log('✓ Test user found:');
            console.log('  ID:', testUsers[0].id);
            console.log('  Name:', testUsers[0].name);
            console.log('  Email:', testUsers[0].email);
            console.log('  Role:', testUsers[0].role);
            console.log('\nCredentials:');
            console.log('  Email: test@example.com');
            console.log('  Password: password123');
        } else {
            console.log('✗ Test user not found. Creating...\n');
            
            const hashedPassword = await bcrypt.hash('password123', 10);
            const [result] = await db.query(
                'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
                ['Test User', 'test@example.com', '9876543210', hashedPassword, 'customer']
            );
            
            console.log('✓ Test user created successfully!');
            console.log('  ID:', result.insertId);
            console.log('\nCredentials:');
            console.log('  Email: test@example.com');
            console.log('  Password: password123');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkAndCreateAdmin();
