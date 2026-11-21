// Runs automatically before `npm run dev` / `npm start` (predev / prestart).
import fs from 'node:fs';
import crypto from 'node:crypto';

const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
const has = (text, key) => new RegExp(`^\\s*${key}\\s*=\\s*\\S+`, 'm').test(text);

let env = read('.env');
const local = read('.env.local');

// 1) Session secret: generate once, keep forever.
if (!has(env, 'SESSION_SECRET') && !has(local, 'SESSION_SECRET')) {
  env += (env && !env.endsWith('\n') ? '\n' : '') + `SESSION_SECRET=${crypto.randomBytes(48).toString('hex')}\n`;
  fs.writeFileSync('.env', env);
  console.log('[setup] Generated SESSION_SECRET in .env');
}

// 2) Make sure secrets can never be committed.
const gi = read('.gitignore');
if (!/^\.env(\.local)?\s*$/m.test(gi)) {
  fs.appendFileSync('.gitignore', (gi && !gi.endsWith('\n') ? '\n' : '') + '.env\n.env.local\n');
  console.log('[setup] Added .env and .env.local to .gitignore');
}

// 3) Database URL must be provided by the user.
if (!has(env, 'DATABASE_URL') && !has(local, 'DATABASE_URL') && !process.env.DATABASE_URL) {
  console.error(
    '\n[setup] DATABASE_URL is not set.\n' +
      '  Add it to .env, for example:\n' +
      '    DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require\n' +
      '  (Use a NEW password if the old one was ever committed or shared.)\n'
  );
  process.exit(1);
}
