import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

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

// Default modules defined per business ID
const DEFAULT_BUSINESS_MODULES: Record<string, Array<{ name: string; slug: string; caption: string; icon: string; sort_order: number }>> = {
  'grow-naturals': [
    { name: 'Plants', slug: 'plants', caption: 'Exotic potted plants, indoor greenery & bonsai', icon: 'Trees', sort_order: 1 },
    { name: 'Cactus', slug: 'cactus', caption: 'Desert succulents, hardy cactus & grafting specimens', icon: 'Sprout', sort_order: 2 },
    { name: 'Pots', slug: 'pots', caption: 'Artisan glazed pots, self-watering pots & planters', icon: 'Box', sort_order: 3 },
    { name: 'Fertilizers', slug: 'fertilizers', caption: 'Bio boosters, seaweed tonics, soil mixes & neem sprays', icon: 'FlaskConical', sort_order: 4 },
    { name: 'Flowers', slug: 'flowers', caption: 'Fresh cut lilies, orchids, and luxury arrangements', icon: 'Flower2', sort_order: 5 },
  ],
  'nikhlesh-nursery': [
    { name: 'Nursery Plants', slug: 'nursery-plants', caption: 'Outdoor garden plants, shrubs & hedge saplings', icon: 'Trees', sort_order: 1 },
    { name: 'Fruit Trees', slug: 'fruit-trees', caption: 'Grafted mango, guava, citrus & seasonal fruit saplings', icon: 'Leaf', sort_order: 2 },
    { name: 'Seeds & Bulbs', slug: 'seeds-bulbs', caption: 'Vegetable seeds, flower bulbs & nursery starter plugs', icon: 'Sprout', sort_order: 3 },
    { name: 'Soil & Manure', slug: 'soil-manure', caption: 'Organic vermicompost, cow dung manure, cocopeat & red soil', icon: 'FlaskConical', sort_order: 4 },
    { name: 'Nursery Pots', slug: 'nursery-pots', caption: 'Black nursery grow bags, terracotta pots & plastic containers', icon: 'Box', sort_order: 5 },
  ]
};

// GET /api/inventory-modules - Scoped or Combined
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    let result = await db.query(
      `SELECT im.*, b.name as business_name FROM inventory_modules im
       LEFT JOIN businesses b ON im.business_id = b.id
       WHERE ($1 = 'all' OR $1 = 'combined' OR im.business_id = $1)
       ORDER BY im.sort_order ASC, im.created_at ASC`,
      [businessId]
    );

    // Auto-seed default modules if this business has none in DB
    if (result.rows.length === 0) {
      const defaults = DEFAULT_BUSINESS_MODULES[businessId] || [
        { name: 'Plants & Flora', slug: 'plants-flora', caption: 'Botanical and garden plants', icon: 'Trees', sort_order: 1 },
        { name: 'Pots & Planters', slug: 'pots-planters', caption: 'Pots, containers and nursery bags', icon: 'Box', sort_order: 2 },
        { name: 'Soil & Fertilizers', slug: 'soil-fertilizers', caption: 'Plant care, soil and nutrients', icon: 'FlaskConical', sort_order: 3 },
      ];

      for (const d of defaults) {
        const id = `inv-mod-${businessId}-${d.slug}`;
        await db.query(
          `INSERT INTO inventory_modules (id, business_id, name, slug, caption, icon, image_url, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, '', $7)
           ON CONFLICT DO NOTHING`,
          [id, businessId, d.name, d.slug, d.caption, d.icon, d.sort_order]
        );
      }

      result = await db.query(
        `SELECT * FROM inventory_modules
         WHERE business_id = $1
         ORDER BY sort_order ASC, created_at ASC`,
        [businessId]
      );
    }

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
      return res.status(400).json({ error: 'Category name is required' });
    }

    const trimmedName = name.trim();
    let slug = req.body.slug ? generateSlug(req.body.slug) : generateSlug(trimmedName);
    if (!slug) slug = `mod-${Date.now()}`;

    const db = await getDb();
    const id = `inv-mod-${businessId}-${slug}-${Date.now().toString(36)}`;

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
    const { name, caption, icon, image_url, sort_order, slug } = req.body;
    const db = await getDb();

    const result = await db.query(
      `UPDATE inventory_modules SET
        name = COALESCE($1, name),
        caption = COALESCE($2, caption),
        icon = COALESCE($3, icon),
        image_url = COALESCE($4, image_url),
        sort_order = COALESCE($5, sort_order),
        slug = COALESCE($6, slug)
       WHERE id = $7
       RETURNING *`,
      [
        name ? name.trim() : undefined,
        caption !== undefined ? caption.trim() : undefined,
        icon !== undefined ? icon : undefined,
        image_url !== undefined ? image_url : undefined,
        sort_order !== undefined ? Number(sort_order) : undefined,
        slug ? generateSlug(slug) : undefined,
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

// DELETE /api/inventory-modules/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.query(`DELETE FROM inventory_modules WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Category removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
