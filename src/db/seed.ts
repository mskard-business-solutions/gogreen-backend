import { db } from './index.js';
import { users } from './schema.js';
import argon2 from 'argon2';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Hash passwords
    const adminPassword = await argon2.hash('admin123');
    const editorPassword = await argon2.hash('editor123');

    // Insert default users
    await db.insert(users).values([
      {
        email: 'admin@gogreen.com',
        password: adminPassword,
        role: 'admin',
      },
      {
        email: 'editor@gogreen.com',
        password: editorPassword,
        role: 'editor',
      },
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('Default users created:');
    console.log('  Admin - email: admin@gogreen.com, password: admin123');
    console.log('  Editor - email: editor@gogreen.com, password: editor123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
