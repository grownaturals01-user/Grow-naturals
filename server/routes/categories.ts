import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

const DEFAULT_BUSINESS_SUBCATEGORIES: Record<string, Array<{ name: string; type: string; description: string; sort_order: number }>> = {
  'grow-naturals': [
    { name: 'Indoor Greens', type: 'plants', description: 'Hardy indoor potted plants & desk greenery', sort_order: 1 },
    { name: 'Bonsai Specimens', type: 'plants', description: 'Artisan trained ficus and jade bonsai plants', sort_order: 2 },
    { name: 'Grafted Succulents', type: 'cactus', description: 'Desert grafting specimens & moon cactus', sort_order: 1 },
    { name: 'Ceramic Planters', type: 'pots', description: 'Premium glazed indoor ceramic pots', sort_order: 1 },
    { name: 'Organic Boosters', type: 'fertilizers', description: 'Seaweed extracts & vermicompost tonics', sort_order: 1 },
    { name: 'Cut Lilies & Orchids', type: 'flowers', description: 'Fresh floral stems & celebration arrangements', sort_order: 1 },
  ],
  'nikhlesh-nursery': [
    { name: 'Fruit Saplings', type: 'fruit-trees', description: 'Grafted mango, guava & lemon fruit trees', sort_order: 1 },
    { name: 'Shade & Hedge Trees', type: 'nursery-plants', description: 'Outdoor privacy hedges & landscaping trees', sort_order: 1 },
    { name: 'Vegetable Seeds', type: 'seeds-bulbs', description: 'High-yield seasonal kitchen garden seeds', sort_order: 1 },
    { name: 'Red Soil & Cocopeat', type: 'soil-manure', description: 'Nursery potting mix & organic compost', sort_order: 1 },
    { name: 'Black Grow Bags', type: 'nursery-pots', description: 'UV-stabilized HDPE and poly grow bags', sort_order: 1 },
  ]
};

// GET /api/categories - Scoped or Combined
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    let result = await db.query(
      `SELECT c.*, b.name as business_name, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN businesses b ON c.business_id = b.id
       LEFT JOIN products p ON p.category_id = c.id
       WHERE ($1 = 'all' OR $1 = 'combined' OR c.business_id = $1)
       GROUP BY c.id, b.name
       ORDER BY c.sort_order ASC, c.name ASC`,
      [businessId]
    );

    // Auto-seed default subcategories if none exist for this business
    if (result.rows.length === 0 && DEFAULT_BUSINESS_SUBCATEGORIES[businessId]) {
      const defaults = DEFAULT_BUSINESS_SUBCATEGORIES[businessId];
      for (const d of defaults) {
        const id = `cat-${businessId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        await db.query(
          `INSERT INTO categories (id, business_id, name, type, description, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [id, businessId, d.name, d.type, d.description, d.sort_order]
        );
      }

      result = await db.query(
        `SELECT c.*, COUNT(p.id) as product_count
         FROM categories c
         LEFT JOIN products p ON p.category_id = c.id
         WHERE c.business_id = $1
         GROUP BY c.id
         ORDER BY c.sort_order ASC, c.name ASC`,
        [businessId]
      );
    }

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

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subcategory name is required' });
    }

    const db = await getDb();
    const id = `cat-${businessId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO categories (id, business_id, name, type, description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, businessId, name.trim(), type || 'general', description ? description.trim() : '', Number(sort_order) || 0]
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
      [
        name ? name.trim() : undefined,
        type ? type.trim() : undefined,
        description !== undefined ? description.trim() : undefined,
        sort_order !== undefined ? Number(sort_order) : undefined,
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

// DELETE /api/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.query(`DELETE FROM categories WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'Subcategory removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
