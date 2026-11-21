// Must be the FIRST import of the server entry so that DATABASE_URL etc. are
// loaded before db.ts reads them. Loads the same files Next.js uses.
import { config } from 'dotenv';

config({ path: ['.env.local', '.env'] });
