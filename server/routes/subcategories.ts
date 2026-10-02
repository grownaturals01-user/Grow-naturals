import { Router, Request, Response } from 'express';
import { getDb, resolveBusinessId } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/subcategories
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();

    const result = await db.query(
      `SELECT 
         s.*,
         c.name as parent_category_name,
         b.name as business_name,
         COUNT(p.id) as product_count
       FROM subcategories s
       LEFT JOIN categories c ON s.category_id = c.id
       LEFT JOIN businesses b ON s.business_id = b.id
       LEFT JOIN products p ON p.subcategory_id = s.id
       WHERE ($1 = 'all' OR $1 = 'combined' OR s.business_id = $1)
       GROUP BY s.id, c.name, b.name
       ORDER BY s.created_at DESC`,
      [businessId]
    );

    res.json(result.rows || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subcategories
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, category_id, code, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subcategory name is required' });
    }

    const db = await getDb();
    const businessId = await resolveBusinessId(db, req.body.business_id || getBusinessId(req));
    const id = `subcat-${businessId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Resolve category_id if name is passed instead of id
    let resolvedCategoryId = category_id || null;
    if (resolvedCategoryId) {
      const catCheck = await db.query(`SELECT id FROM categories WHERE id = $1 OR name ILIKE $1`, [resolvedCategoryId]);
      if (catCheck.rows.length > 0) {
        resolvedCategoryId = catCheck.rows[0].id;
      }
    }

    const result = await db.query(
      `INSERT INTO subcategories (id, business_id, category_id, name, code, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        businessId,
        resolvedCategoryId,
        name.trim(),
        code ? code.trim() : '',
        description ? description.trim() : ''
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/subcategories/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category_id, code, description } = req.body;

    const db = await getDb();

    let resolvedCategoryId = category_id;
    if (resolvedCategoryId) {
      const catCheck = await db.query(`SELECT id FROM categories WHERE id = $1 OR name ILIKE $1`, [resolvedCategoryId]);
      if (catCheck.rows.length > 0) {
        resolvedCategoryId = catCheck.rows[0].id;
      }
    }

    const result = await db.query(
      `UPDATE subcategories SET
        name = COALESCE($1, name),
        category_id = COALESCE($2, category_id),
        code = COALESCE($3, code),
        description = COALESCE($4, description)
       WHERE id = $5
       RETURNING *`,
      [
        name ? name.trim() : undefined,
        resolvedCategoryId !== undefined ? resolvedCategoryId : undefined,
        code !== undefined ? code.trim() : undefined,
        description !== undefined ? description.trim() : undefined,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/subcategories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.query(`DELETE FROM subcategories WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'Subcategory removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
