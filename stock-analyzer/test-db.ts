import { connectToDatabase } from './database/mongoose';
import mongoose from 'mongoose';

async function testConnection() {
    try {
        await connectToDatabase();
        console.log("Database connection successful!");
        process.exit(0);
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

testConnection();
