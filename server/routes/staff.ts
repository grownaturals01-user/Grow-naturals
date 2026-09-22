import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// GET /api/staff
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role, status, search } = req.query;
    const db = await getDb();

    let query = `
      SELECT id, name, username, email, role, phone, status, permissions, created_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex++}`;
      params.push(role);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR username ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY name ASC`;

    const result = await db.query(query, params);
    const parsed = result.rows.map(u => ({
      ...u,
      permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {})
    }));

    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/staff/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query(
      `SELECT id, name, username, email, role, phone, status, permissions, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const u = result.rows[0];
    res.json({
      ...u,
      permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {})
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/staff
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, role, phone, permissions } = req.body;

    if (!name || !username || !email) {
      return res.status(400).json({ error: 'Name, username, and email are required' });
    }

    const db = await getDb();

    // Check duplicate username
    const check = await db.query(`SELECT id FROM users WHERE LOWER(username) = LOWER($1)`, [username.trim()]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const permString = typeof permissions === 'object' ? JSON.stringify(permissions) : (permissions || '{}');

    const result = await db.query(
      `INSERT INTO users (id, name, username, email, password_hash, role, phone, status, permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)
       RETURNING id, name, username, email, role, phone, status, permissions, created_at`,
      [id, name, username.trim(), email.trim(), password || 'staff123', role || 'staff', phone || '', permString]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/staff/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, status, permissions, password } = req.body;

    const db = await getDb();
    const permString = permissions !== undefined ? (typeof permissions === 'object' ? JSON.stringify(permissions) : permissions) : undefined;

    let query = `UPDATE users SET
      name = COALESCE($1, name),
      email = COALESCE($2, email),
      role = COALESCE($3, role),
      phone = COALESCE($4, phone),
      status = COALESCE($5, status)`;
    const params: any[] = [name, email, role, phone, status];
    let paramIndex = 6;

    if (permString !== undefined) {
      query += `, permissions = $${paramIndex++}`;
      params.push(permString);
    }

    if (password) {
      query += `, password_hash = $${paramIndex++}`;
      params.push(password);
    }

    query += ` WHERE id = $${paramIndex} RETURNING id, name, username, email, role, phone, status, permissions, created_at`;
    params.push(id);

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.query(`UPDATE users SET status = 'inactive' WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'User deactivated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
