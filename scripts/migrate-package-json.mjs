// One-time: node scripts/migrate-package-json.mjs
// Updates package.json for Next.js + Express. Keeps every version you already have;
// only adds what is missing. Writes package.json.bak first.
import fs from 'node:fs';

const file = 'package.json';
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
fs.writeFileSync('package.json.bak', JSON.stringify(pkg, null, 2) + '\n');

pkg.scripts = {
  ...pkg.scripts,
  predev: 'node scripts/prepare-env.mjs',
  dev: 'concurrently -k -n api,web -c blue,green "npm:dev:api" "npm:dev:web"',
  'dev:api': 'tsx watch src/server/index.ts',
  'dev:web': 'next dev',
  build: 'next build',
  prestart: 'node scripts/prepare-env.mjs',
  start: 'concurrently -k -n api,web -c blue,green "npm:start:api" "npm:start:web"',
  'start:api': 'cross-env NODE_ENV=production tsx src/server/index.ts',
  'start:web': 'next start',
};

const wantDeps = {
  next: '^16.0.0', react: '^19.0.0', 'react-dom': '^19.0.0',
  express: '^4.21.2', 'express-session': '^1.18.1', 'connect-pg-simple': '^10.0.0',
  'express-rate-limit': '^7.5.0', pg: '^8.13.0', dotenv: '^16.4.7', bcryptjs: '^2.4.3',
};
const wantDev = {
  tsx: '^4.19.0', concurrently: '^9.1.0', 'cross-env': '^7.0.3', typescript: '^5.7.0',
  '@types/node': '^22.0.0', '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0',
  '@types/express': '^4.17.21', '@types/express-session': '^1.18.0', '@types/pg': '^8.11.10',
  '@types/connect-pg-simple': '^7.0.3', '@types/bcryptjs': '^2.4.6',
  tailwindcss: '^4.0.0', '@tailwindcss/postcss': '^4.0.0', postcss: '^8.4.49',
};

pkg.dependencies ||= {}; pkg.devDependencies ||= {};
// bcryptjs v3+ ships its own types; the old @types package would conflict with it.
if (/^[\^~]?3/.test(pkg.dependencies.bcryptjs || pkg.devDependencies.bcryptjs || '')) delete wantDev['@types/bcryptjs'];
const exists = (n) => n in pkg.dependencies || n in pkg.devDependencies;
const added = [];
for (const [n, v] of Object.entries(wantDeps)) if (!exists(n)) { pkg.dependencies[n] = v; added.push(n); }
for (const [n, v] of Object.entries(wantDev))  if (!exists(n)) { pkg.devDependencies[n] = v; added.push(n); }

fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json updated (backup: package.json.bak)');
console.log(added.length ? 'Added: ' + added.join(', ') : 'No new packages needed.');
console.log('\nNext: npm install   then   npm run dev');
