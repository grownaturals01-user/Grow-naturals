import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/variant-attributes
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const result = await db.query(
      `SELECT va.*, bus.name as business_name
       FROM variant_attributes va
       LEFT JOIN businesses bus ON va.business_id = bus.id
       WHERE (
         $1 = 'all' 
         OR $1 = 'combined' 
         OR va.business_id = $1 
         OR va.business_id = 'all'
         OR (va.business_ids IS NOT NULL AND va.business_ids::text ILIKE '%' || $1 || '%')
       )
       ORDER BY va.created_at DESC`,
      [businessId]
    );

    const rows = (result.rows || []).map((row: any) => {
      let bIds: string[] = [];
      if (Array.isArray(row.business_ids)) {
        bIds = row.business_ids;
      } else if (typeof row.business_ids === 'string') {
        try {
          bIds = JSON.parse(row.business_ids);
        } catch {
          bIds = row.business_ids ? [row.business_ids] : [];
        }
      }
      if (bIds.length === 0 && row.business_id) {
        bIds = row.business_id === 'all' ? ['grow-naturals', 'nikhlesh-nursery'] : [row.business_id];
      }

      let pImages: Record<string, string> = {};
      if (row.pattern_images) {
        if (typeof row.pattern_images === 'object' && row.pattern_images !== null) {
          pImages = row.pattern_images;
        } else if (typeof row.pattern_images === 'string') {
          try {
            pImages = JSON.parse(row.pattern_images);
          } catch {
            pImages = {};
          }
        }
      }

      const isMappedToBoth = row.business_id === 'all' || bIds.length >= 2;

      return {
        ...row,
        business_ids: bIds,
        pattern_images: pImages,
        is_mapped_to_both: isMappedToBoth,
        display_business: isMappedToBoth ? 'Both Businesses' : (row.business_name || (bIds[0] === 'nikhlesh-nursery' ? 'Nikhlesh Nursery' : 'Grow Naturals'))
      };
    });

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/variant-attributes/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await db.query(
      `SELECT va.*, bus.name as business_name
       FROM variant_attributes va
       LEFT JOIN businesses bus ON va.business_id = bus.id
       WHERE va.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variant attribute not found' });
    }
    const row = result.rows[0];
    let bIds: string[] = [];
    if (Array.isArray(row.business_ids)) {
      bIds = row.business_ids;
    } else if (typeof row.business_ids === 'string') {
      try {
        bIds = JSON.parse(row.business_ids);
      } catch {
        bIds = row.business_ids ? [row.business_ids] : [];
      }
    }
    if (bIds.length === 0 && row.business_id) {
      bIds = row.business_id === 'all' ? ['grow-naturals', 'nikhlesh-nursery'] : [row.business_id];
    }

    let pImages: Record<string, string> = {};
    if (row.pattern_images) {
      if (typeof row.pattern_images === 'object' && row.pattern_images !== null) {
        pImages = row.pattern_images;
      } else if (typeof row.pattern_images === 'string') {
        try {
          pImages = JSON.parse(row.pattern_images);
        } catch {
          pImages = {};
        }
      }
    }

    res.json({
      ...row,
      business_ids: bIds,
      pattern_images: pImages,
      is_mapped_to_both: row.business_id === 'all' || bIds.length >= 2
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/variant-attributes
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, values, patterns, pattern_images, status, business_ids, business_id } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Variant attribute name is required' });
    }
    if (!values || !values.trim()) {
      return res.status(400).json({ error: 'Variant values are required' });
    }

    // Determine targeted businesses
    let targetBizIds: string[] = [];
    if (Array.isArray(business_ids) && business_ids.length > 0) {
      targetBizIds = business_ids;
    } else if (business_id && business_id !== 'all') {
      targetBizIds = [business_id];
    } else {
      const headerBiz = getBusinessId(req);
      if (headerBiz !== 'all' && headerBiz !== 'combined') {
        targetBizIds = [headerBiz];
      } else {
        targetBizIds = ['grow-naturals', 'nikhlesh-nursery'];
      }
    }

    const isBoth = targetBizIds.includes('all') || targetBizIds.length >= 2;
    const primaryBizId = isBoth ? 'all' : targetBizIds[0];
    const finalBizIds = isBoth
      ? ['grow-naturals', 'nikhlesh-nursery']
      : targetBizIds;

    const db = await getDb();
    const id = `va-${primaryBizId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Normalize comma-separated values (clean whitespace)
    const normalizedValues = values
      .split(',')
      .map((v: string) => v.trim())
      .filter((v: string) => v.length > 0)
      .join(', ');

    const normalizedPatterns = patterns
      ? patterns
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0)
          .join(', ')
      : '';

    const normalizedPatternImages = pattern_images && typeof pattern_images === 'object'
      ? JSON.stringify(pattern_images)
      : (typeof pattern_images === 'string' ? pattern_images : '{}');

    const result = await db.query(
      `INSERT INTO variant_attributes (id, business_id, business_ids, name, values, patterns, pattern_images, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        primaryBizId,
        JSON.stringify(finalBizIds),
        name.trim(),
        normalizedValues || values.trim(),
        normalizedPatterns,
        normalizedPatternImages,
        status || 'Active'
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      business_ids: finalBizIds,
      pattern_images: pattern_images || {},
      is_mapped_to_both: isBoth
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/variant-attributes/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, values, patterns, pattern_images, status, business_ids, business_id } = req.body;
    const db = await getDb();

    let normalizedValues: string | undefined = undefined;
    if (values !== undefined) {
      normalizedValues = values
        .split(',')
        .map((v: string) => v.trim())
        .filter((v: string) => v.length > 0)
        .join(', ');
    }

    let normalizedPatterns: string | undefined = undefined;
    if (patterns !== undefined) {
      normalizedPatterns = patterns
        .split(',')
        .map((v: string) => v.trim())
        .filter((v: string) => v.length > 0)
        .join(', ');
    }

    let normalizedPatternImages: string | undefined = undefined;
    if (pattern_images !== undefined) {
      normalizedPatternImages = typeof pattern_images === 'object'
        ? JSON.stringify(pattern_images)
        : String(pattern_images);
    }

    let primaryBizId: string | undefined = undefined;
    let finalBizIdsStr: string | undefined = undefined;

    if (Array.isArray(business_ids) && business_ids.length > 0) {
      const isBoth = business_ids.includes('all') || business_ids.length >= 2;
      primaryBizId = isBoth ? 'all' : business_ids[0];
      const arr = isBoth ? ['grow-naturals', 'nikhlesh-nursery'] : business_ids;
      finalBizIdsStr = JSON.stringify(arr);
    } else if (business_id) {
      primaryBizId = business_id;
      const arr = business_id === 'all' ? ['grow-naturals', 'nikhlesh-nursery'] : [business_id];
      finalBizIdsStr = JSON.stringify(arr);
    }

    const result = await db.query(
      `UPDATE variant_attributes SET
        name = COALESCE($1, name),
        values = COALESCE($2, values),
        patterns = COALESCE($3, patterns),
        pattern_images = COALESCE($4, pattern_images),
        status = COALESCE($5, status),
        business_id = COALESCE($6, business_id),
        business_ids = COALESCE($7, business_ids),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        name ? name.trim() : undefined,
        normalizedValues !== undefined ? normalizedValues : undefined,
        normalizedPatterns !== undefined ? normalizedPatterns : undefined,
        normalizedPatternImages !== undefined ? normalizedPatternImages : undefined,
        status !== undefined ? status : undefined,
        primaryBizId,
        finalBizIdsStr,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variant attribute not found' });
    }

    const updated = result.rows[0];
    let bIds: string[] = [];
    try {
      bIds = typeof updated.business_ids === 'string' ? JSON.parse(updated.business_ids) : updated.business_ids;
    } catch {
      bIds = [updated.business_id];
    }

    res.json({
      ...updated,
      business_ids: bIds,
      is_mapped_to_both: updated.business_id === 'all' || (Array.isArray(bIds) && bIds.length >= 2)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/variant-attributes/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const check = await db.query(`SELECT id FROM variant_attributes WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Variant attribute not found' });
    }

    await db.query(`DELETE FROM variant_attributes WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Variant attribute deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
