import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

async function setupDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        const schema = readFileSync('./database/schema.sql', 'utf8');
        await connection.query(schema);
        
        console.log('✓ Database setup completed successfully');
        await connection.end();
    } catch (error) {
        console.error('Database setup failed:', error.message);
        process.exit(1);
    }
}

setupDatabase();
