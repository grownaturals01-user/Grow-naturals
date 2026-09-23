import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/inventory-modules
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const result = await db.query(
      `SELECT * FROM inventory_modules
       WHERE business_id = $1
       ORDER BY sort_order ASC, created_at ASC`,
      [businessId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory-modules
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.body.business_id || getBusinessId(req);
    const { name, caption, icon, image_url, sort_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Inventory module name is required' });
    }

    const trimmedName = name.trim();
    let slug = req.body.slug ? generateSlug(req.body.slug) : generateSlug(trimmedName);
    if (!slug) slug = `module-${Date.now()}`;

    const db = await getDb();
    const id = `inv-mod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO inventory_modules (id, business_id, name, slug, caption, icon, image_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        businessId,
        trimmedName,
        slug,
        caption ? caption.trim() : '',
        icon || '📦',
        image_url || '',
        Number(sort_order) || 0
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inventory-modules/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, caption, icon, image_url, sort_order } = req.body;
    const db = await getDb();

    const result = await db.query(
      `UPDATE inventory_modules SET
        name = COALESCE($1, name),
        caption = COALESCE($2, caption),
        icon = COALESCE($3, icon),
        image_url = COALESCE($4, image_url),
        sort_order = COALESCE($5, sort_order)
       WHERE id = $6
       RETURNING *`,
      [
        name ? name.trim() : undefined,
        caption !== undefined ? caption.trim() : undefined,
        icon !== undefined ? icon : undefined,
        image_url !== undefined ? image_url : undefined,
        sort_order !== undefined ? Number(sort_order) : undefined,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory module not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/inventory-modules/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.query(`DELETE FROM inventory_modules WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Inventory module removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
