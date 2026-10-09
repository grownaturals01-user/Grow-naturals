import { Router, Request, Response } from 'express';
import { getDb, resolveBusinessId } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// Ensure columns exist
async function ensureCategoryColumns(db: any) {
  try {
    await db.exec(`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'Active';
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(128) DEFAULT '';
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(128) DEFAULT '';
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
    `);
  } catch (err) {
    // Ignore if already exists
  }
}

// GET /api/categories - Scoped or Combined
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    await ensureCategoryColumns(db);

    const result = await db.query(
      `SELECT c.*, b.name as business_name, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN businesses b ON c.business_id = b.id
       LEFT JOIN products p ON p.category_id = c.id
       WHERE ($1 = 'all' OR $1 = 'combined' OR c.business_id = $1)
       GROUP BY c.id, b.name
       ORDER BY c.sort_order ASC, c.name ASC`,
      [businessId]
    );

    const enriched = (result.rows || []).map((cat: any) => ({
      ...cat,
      status: cat.status || 'Active',
      slug: cat.slug || cat.type || (cat.name ? cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
      product_count: Number(cat.product_count || 0)
    }));

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, slug, code, type, description, sort_order, icon, image_url, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const cleanType = (slug || code || type || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general').trim();

    const db = await getDb();
    await ensureCategoryColumns(db);
    const businessId = await resolveBusinessId(db, req.body.business_id || getBusinessId(req));
    const id = `cat-${businessId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO categories (id, business_id, name, type, slug, description, sort_order, icon, image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        businessId,
        trimmedName,
        cleanType,
        cleanType,
        description ? description.trim() : '',
        Number(sort_order) || 0,
        icon || '',
        image_url || '',
        status || 'Active'
      ]
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
    const { name, slug, code, type, description, sort_order, icon, image_url, status } = req.body;

    const db = await getDb();
    await ensureCategoryColumns(db);
    const cleanType = slug || code || type;

    const result = await db.query(
      `UPDATE categories SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        sort_order = COALESCE($4, sort_order),
        icon = COALESCE($5, icon),
        image_url = COALESCE($6, image_url),
        status = COALESCE($7, status)
       WHERE id = $8
       RETURNING *`,
      [
        name ? name.trim() : undefined,
        cleanType ? cleanType.trim() : undefined,
        description !== undefined ? description.trim() : undefined,
        sort_order !== undefined ? Number(sort_order) : undefined,
        icon !== undefined ? icon : undefined,
        image_url !== undefined ? image_url : undefined,
        status !== undefined ? status : undefined,
        id
      ]
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
    res.json({ success: true, message: 'Category removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
