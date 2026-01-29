import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

import { db } from './db/index.js';
import { users } from './db/schema.js';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';

interface CreateAdminOptions {
  email: string;
  password: string;
}

async function createAdmin({ email, password }: CreateAdminOptions) {
  try {
    console.log('🔐 Creating admin user...');

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      console.error(`❌ User with email ${email} already exists!`);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await argon2.hash(password);

    // Create admin user
    const result = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        role: 'admin',
      })
      .returning();

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('User Details:');
    console.log(`  Email: ${result[0]!.email}`);
    console.log(`  Role: ${result[0]!.role}`);
    console.log(`  ID: ${result[0]!.id}`);
    console.log('');
    console.log('You can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: pnpm create-admin <email> <password>');
  console.log('');
  console.log('Example:');
  console.log('  pnpm create-admin admin@example.com SecurePassword123');
  console.log('');
  console.log('Or use environment variables:');
  console.log('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePassword123 pnpm create-admin');
  process.exit(1);
}

let email: string;
let password: string;

if (args.length >= 2) {
  email = args[0]!;
  password = args[1]!;
} else {
  email = process.env.ADMIN_EMAIL || args[0]!;
  password = process.env.ADMIN_PASSWORD || '';
  
  if (!password) {
    console.error('❌ Password is required!');
    console.log('Usage: pnpm create-admin <email> <password>');
    process.exit(1);
  }
}

// Validate email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format!');
  process.exit(1);
}

// Validate password length
if (password.length < 6) {
  console.error('❌ Password must be at least 6 characters long!');
  process.exit(1);
}

createAdmin({ email, password });
