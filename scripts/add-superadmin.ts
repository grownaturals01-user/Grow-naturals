import { getDb } from '../server/db/connection.js';

async function addSuperAdmin() {
  const db = await getDb();
  const fullPermissions = JSON.stringify({
    dashboard: true, pos: true, quotations: true, delivery_challans: true,
    inventory: true, projects: true, purchases: true, expenses: true,
    refunds: true, invoices: true, staff: true, settings: true
  });

  const existing = await db.query(
    `SELECT id FROM users WHERE LOWER(username) = 'superadmin' OR LOWER(email) = 'superadmin@ev.com'`
  );

  if (existing.rows.length === 0) {
    await db.query(
      `INSERT INTO users (id, name, username, email, password_hash, role, phone, status, permissions)
       VALUES ('usr-superadmin', 'Super Admin', 'superadmin', 'superadmin@ev.com', 'admin123', 'admin', '+91 99999 00000', 'active', $1)`,
      [fullPermissions]
    );
    console.log('Superadmin user created successfully.');
  } else {
    console.log('Superadmin user already exists.');
  }
}

addSuperAdmin().catch(console.error);
