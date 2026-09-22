import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUser = username.trim().toLowerCase();
    const db = await getDb();
    const result = await db.query(
      `SELECT id, name, username, email, password_hash, role, phone, status, permissions
       FROM users WHERE (LOWER(username) = $1 OR LOWER(email) = $1) AND status = 'active'`,
      [cleanUser]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username/email or user is inactive' });
    }

    const user = result.rows[0];
    // Allow matching password, demo passwords, or admin bypass
    const isValidPass =
      user.password_hash === password ||
      password === 'admin123' ||
      password === 'manager123' ||
      password === 'cashier123' ||
      password === 'sup123' ||
      user.role === 'admin';

    if (!isValidPass) {
      return res.status(401).json({ error: 'Invalid password. Try admin123 or use quick demo buttons.' });
    }

    // Default permissions if missing
    let permissions = user.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch {
        permissions = {};
      }
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        permissions: permissions || {}
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Authentication failed' });
  }
});

// GET /api/auth/me/:id
router.get('/me/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query(
      `SELECT id, name, username, email, role, phone, status, permissions
       FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    let permissions = user.permissions;
    if (typeof permissions === 'string') {
      try { permissions = JSON.parse(permissions); } catch { permissions = {}; }
    }

    res.json({
      ...user,
      permissions: permissions || {}
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
