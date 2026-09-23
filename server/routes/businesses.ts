import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// GET /api/businesses
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query(
      `SELECT id, name, legal_name, gstin, address, phone, email, invoice_prefix, invoice_footer, logo_url, currency, default_low_stock, is_taxable, created_at
       FROM businesses ORDER BY created_at ASC, id ASC`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/businesses/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query(
      `SELECT * FROM businesses WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/businesses (Create new business entity)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      id: customId,
      name,
      legal_name,
      gstin,
      address,
      phone,
      email,
      invoice_prefix,
      invoice_footer,
      logo_url,
      currency,
      default_low_stock,
      is_taxable
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    const trimmedName = name.trim();
    const cleanPrefix = (invoice_prefix && invoice_prefix.trim())
      ? invoice_prefix.trim().toUpperCase()
      : `${trimmedName.slice(0, 3).toUpperCase()}-`;

    const rawSlug = customId
      ? String(customId).toLowerCase().trim()
      : trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const baseId = rawSlug || `biz-${Date.now()}`;

    const db = await getDb();
    const existing = await db.query('SELECT id FROM businesses WHERE id = $1', [baseId]);
    const finalId = existing.rows.length > 0 ? `${baseId}-${Date.now().toString().slice(-4)}` : baseId;

    const result = await db.query(
      `INSERT INTO businesses (
        id, name, legal_name, gstin, address, phone, email,
        invoice_prefix, invoice_footer, logo_url, currency, default_low_stock, is_taxable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        finalId,
        trimmedName,
        legal_name?.trim() || trimmedName,
        gstin?.trim() || '',
        address?.trim() || '',
        phone?.trim() || '',
        email?.trim() || '',
        cleanPrefix,
        invoice_footer?.trim() || `Thank you for choosing ${trimmedName}!`,
        logo_url?.trim() || '',
        currency?.trim() || 'INR',
        Number(default_low_stock) || 5,
        Boolean(is_taxable)
      ]
    );

    // Auto-seed starter categories for this business so catalog products can immediately be created
    const starterCategories = [
      { name: 'Plants & Greens', type: 'plants' },
      { name: 'Pots & Planters', type: 'pots' },
      { name: 'Care & Fertilizers', type: 'fertilizers' },
      { name: 'General Merchandise', type: 'general' }
    ];

    for (const cat of starterCategories) {
      const catId = `cat-${finalId}-${cat.type}`;
      try {
        await db.query(
          `INSERT INTO categories (id, business_id, name, type) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
          [catId, finalId, cat.name, cat.type]
        );
      } catch {
        // Safe to ignore if category ID collides
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/businesses/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      legal_name,
      gstin,
      address,
      phone,
      email,
      invoice_prefix,
      invoice_footer,
      currency,
      default_low_stock,
      is_taxable
    } = req.body;

    const db = await getDb();
    const result = await db.query(
      `UPDATE businesses
       SET name = COALESCE($1, name),
           legal_name = COALESCE($2, legal_name),
           gstin = COALESCE($3, gstin),
           address = COALESCE($4, address),
           phone = COALESCE($5, phone),
           email = COALESCE($6, email),
           invoice_prefix = COALESCE($7, invoice_prefix),
           invoice_footer = COALESCE($8, invoice_footer),
           currency = COALESCE($9, currency),
           default_low_stock = COALESCE($10, default_low_stock),
           is_taxable = COALESCE($11, is_taxable)
       WHERE id = $12
       RETURNING *`,
      [
        name,
        legal_name,
        gstin,
        address,
        phone,
        email,
        invoice_prefix,
        invoice_footer,
        currency,
        default_low_stock,
        is_taxable !== undefined ? Boolean(is_taxable) : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/businesses/:id (Delete business with financial safeguards)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    // Safeguard 1: Do not delete if it is the only remaining business
    const countRes = await db.query('SELECT COUNT(*) as cnt FROM businesses');
    const totalCount = parseInt(countRes.rows[0]?.cnt || '0', 10);
    if (totalCount <= 1) {
      return res.status(400).json({
        error: 'Cannot delete the only remaining business. At least one business must remain active.'
      });
    }

    // Safeguard 2: Do not delete if existing sales invoices are associated with this business
    const invCountRes = await db.query(
      'SELECT COUNT(*) as cnt FROM invoices WHERE business_id = $1',
      [id]
    );
    const invoiceCount = parseInt(invCountRes.rows[0]?.cnt || '0', 10);
    if (invoiceCount > 0) {
      return res.status(400).json({
        error: `Cannot delete this business because it is linked to ${invoiceCount} sales invoice(s). Financial records cannot be orphaned.`
      });
    }

    // Clean up scoped inventory and categories for this business
    await db.query('DELETE FROM products WHERE business_id = $1', [id]);
    await db.query('DELETE FROM categories WHERE business_id = $1', [id]);

    const delResult = await db.query(
      'DELETE FROM businesses WHERE id = $1 RETURNING *',
      [id]
    );

    if (delResult.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({ message: 'Business successfully deleted', deleted: delResult.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
