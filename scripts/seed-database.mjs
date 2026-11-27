#!/usr/bin/env node

/**
 * Database Seeding Script
 * Run this to initialize/reset the database with seed data
 */

import { initDatabase } from '../src/server/db.ts';

console.log('='.repeat(60));
console.log('Starting Database Seeding Process');
console.log('='.repeat(60));

try {
  await initDatabase();
  console.log('\n✓ Database seeding completed successfully!');
  console.log('\nDefault Login Credentials:');
  console.log('-'.repeat(60));
  console.log('Username: admin');
  console.log('Password: Admin@123');
  console.log('-'.repeat(60));
  console.log('\nOther Test Accounts:');
  console.log('  Teacher: teacher.miller / Admin@123');
  console.log('  Teacher: teacher.davis / Admin@123');
  console.log('  Registrar: registrar.hayes / Admin@123');
  console.log('  Student: stu.kaleb / Admin@123');
  console.log('  Student: stu.sophia / Admin@123');
  console.log('='.repeat(60));
  process.exit(0);
} catch (error) {
  console.error('\n✗ Database seeding failed:', error);
  process.exit(1);
}
