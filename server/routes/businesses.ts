import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// GET /api/businesses
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query(
      `SELECT id, name, legal_name, gstin, address, phone, email, invoice_prefix, invoice_footer, logo_url, currency, default_low_stock
       FROM businesses ORDER BY id ASC`
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

// PUT /api/businesses/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, legal_name, gstin, address, phone, email, invoice_prefix, invoice_footer, currency, default_low_stock } = req.body;

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
           default_low_stock = COALESCE($10, default_low_stock)
       WHERE id = $11
       RETURNING *`,
      [name, legal_name, gstin, address, phone, email, invoice_prefix, invoice_footer, currency, default_low_stock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
