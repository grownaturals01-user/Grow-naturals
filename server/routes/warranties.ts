import { Router, Request, Response } from 'express';
import { getDb, resolveBusinessId } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/warranties
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const result = await db.query(
      `SELECT w.*, bus.name as business_name
       FROM warranties w
       LEFT JOIN businesses bus ON w.business_id = bus.id
       WHERE ($1 = 'all' OR $1 = 'combined' OR w.business_id = $1)
       ORDER BY w.created_at DESC`,
      [businessId]
    );

    res.json(result.rows || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/warranties/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await db.query(`SELECT * FROM warranties WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warranty not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/warranties
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, duration, period, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Warranty name is required' });
    }
    if (!duration) {
      return res.status(400).json({ error: 'Duration is required' });
    }

    const db = await getDb();
    const businessId = await resolveBusinessId(db, req.body.business_id || getBusinessId(req));
    const id = `warr-${businessId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO warranties (id, business_id, name, description, duration, period, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        businessId,
        name.trim(),
        description ? description.trim() : '',
        String(duration).trim(),
        period ? String(period).trim() : 'Month',
        status || 'Active'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/warranties/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, duration, period, status } = req.body;
    const db = await getDb();

    const result = await db.query(
      `UPDATE warranties SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        duration = COALESCE($3, duration),
        period = COALESCE($4, period),
        status = COALESCE($5, status)
       WHERE id = $6
       RETURNING *`,
      [
        name ? name.trim() : undefined,
        description !== undefined ? description.trim() : undefined,
        duration !== undefined ? String(duration).trim() : undefined,
        period !== undefined ? String(period).trim() : undefined,
        status !== undefined ? status : undefined,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warranty not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/warranties/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const check = await db.query(`SELECT id FROM warranties WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Warranty not found' });
    }

    await db.query(`DELETE FROM warranties WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Warranty deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
