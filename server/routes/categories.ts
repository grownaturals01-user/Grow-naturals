import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

// GET /api/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const result = await db.query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       WHERE c.business_id = $1
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`,
      [businessId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.body.business_id || getBusinessId(req);
    const { name, type, description, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const db = await getDb();
    const id = `cat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO categories (id, business_id, name, type, description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, businessId, name, type || 'general', description || '', Number(sort_order) || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, description, sort_order } = req.body;

    const db = await getDb();
    const result = await db.query(
      `UPDATE categories SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        description = COALESCE($3, description),
        sort_order = COALESCE($4, sort_order)
       WHERE id = $5
       RETURNING *`,
      [name, type, description, sort_order !== undefined ? Number(sort_order) : undefined, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.query(`DELETE FROM categories WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
