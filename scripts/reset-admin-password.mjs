#!/usr/bin/env node

/**
 * Reset Admin Password Script
 * Sets admin password to Admin@123
 */

import { pool } from '../src/server/db.ts';
import bcrypt from 'bcryptjs';

console.log('='.repeat(60));
console.log('Resetting Admin Password');
console.log('='.repeat(60));

try {
  const newPassword = 'Admin@123';
  const newHash = await bcrypt.hash(newPassword, 12);

  // Update all users to use the new password
  const result = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE 1=1 RETURNING username',
    [newHash]
  );

  console.log(`\n✓ Updated ${result.rowCount} user passwords`);
  console.log('\nUsers updated:');
  result.rows.forEach(row => {
    console.log(`  - ${row.username}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('All users now have password: Admin@123');
  console.log('='.repeat(60));
  
  await pool.end();
  process.exit(0);
} catch (error) {
  console.error('\n✗ Password reset failed:', error);
  await pool.end();
  process.exit(1);
}
