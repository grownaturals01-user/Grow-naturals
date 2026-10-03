import { Router, Request, Response } from 'express';
import { getDb, resolveBusinessId } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/brands
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const result = await db.query(
      `SELECT b.*, bus.name as business_name
       FROM brands b
       LEFT JOIN businesses bus ON b.business_id = bus.id
       WHERE ($1 = 'all' OR $1 = 'combined' OR b.business_id = $1)
       ORDER BY b.created_at DESC`,
      [businessId]
    );

    res.json(result.rows || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/brands/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await db.query(`SELECT * FROM brands WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/brands
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, slug, logo_url, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    const trimmedName = name.trim();
    const brandSlug = slug ? generateSlug(slug) : generateSlug(trimmedName);

    const db = await getDb();
    const businessId = await resolveBusinessId(db, req.body.business_id || getBusinessId(req));
    const id = `brand-${businessId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO brands (id, business_id, name, slug, logo_url, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        businessId,
        trimmedName,
        brandSlug,
        logo_url || '',
        status || 'Active'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/brands/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, logo_url, status } = req.body;
    const db = await getDb();

    const result = await db.query(
      `UPDATE brands SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        logo_url = COALESCE($3, logo_url),
        status = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [
        name ? name.trim() : undefined,
        slug ? generateSlug(slug) : undefined,
        logo_url !== undefined ? logo_url : undefined,
        status !== undefined ? status : undefined,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/brands/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const check = await db.query(`SELECT id FROM brands WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    await db.query(`DELETE FROM brands WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
