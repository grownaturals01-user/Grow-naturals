import { Router, Request, Response } from 'express';
import { getDb, resolveBusinessId } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/units
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const result = await db.query(
      `SELECT u.*, bus.name as business_name, 0 as noofproducts
       FROM units u
       LEFT JOIN businesses bus ON u.business_id = bus.id
       WHERE ($1 = 'all' OR $1 = 'combined' OR u.business_id = $1)
       ORDER BY u.created_at DESC`,
      [businessId]
    );

    res.json(result.rows || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/units/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await db.query(`SELECT * FROM units WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/units
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, short_name, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Unit name is required' });
    }
    if (!short_name || !short_name.trim()) {
      return res.status(400).json({ error: 'Short name is required' });
    }

    const db = await getDb();
    const businessId = await resolveBusinessId(db, req.body.business_id || getBusinessId(req));
    const id = `unit-${businessId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO units (id, business_id, name, short_name, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        id,
        businessId,
        name.trim(),
        short_name.trim(),
        status || 'Active'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/units/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, short_name, status } = req.body;
    const db = await getDb();

    const result = await db.query(
      `UPDATE units SET
        name = COALESCE($1, name),
        short_name = COALESCE($2, short_name),
        status = COALESCE($3, status)
       WHERE id = $4
       RETURNING *`,
      [
        name ? name.trim() : undefined,
        short_name ? short_name.trim() : undefined,
        status !== undefined ? status : undefined,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/units/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const check = await db.query(`SELECT id FROM units WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    await db.query(`DELETE FROM units WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Unit deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
