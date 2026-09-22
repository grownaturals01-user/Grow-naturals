import { initDb } from '../server/db/connection.js';
import { seedDatabase } from '../server/db/seed.js';

async function main() {
  console.log('Testing DB initialization...');
  await initDb();
  await seedDatabase();
  console.log('Success! Database verified.');
  process.exit(0);
}

main().catch(err => {
  console.error('DB test error:', err);
  process.exit(1);
});
