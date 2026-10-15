import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

let columnsEnsured = false;
async function ensureVariantAttributeColumns(db: any) {
  if (columnsEnsured) return;
  try {
    await db.exec(`
      ALTER TABLE variant_attributes ADD COLUMN IF NOT EXISTS patterns TEXT DEFAULT '';
      ALTER TABLE variant_attributes ADD COLUMN IF NOT EXISTS pattern_images TEXT DEFAULT '{}';
      ALTER TABLE variant_attributes ADD COLUMN IF NOT EXISTS value_images TEXT DEFAULT '{}';
      ALTER TABLE variant_attributes ADD COLUMN IF NOT EXISTS attribute_type VARCHAR(32) DEFAULT 'general';
      ALTER TABLE variant_attributes ADD COLUMN IF NOT EXISTS product_id VARCHAR(64) DEFAULT '';
      ALTER TABLE variant_attributes ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) DEFAULT '';
      ALTER TABLE variant_attributes ADD COLUMN IF NOT EXISTS category VARCHAR(128) DEFAULT '';
      ALTER TABLE variant_attributes ADD COLUMN IF NOT EXISTS sizes TEXT DEFAULT '';
      ALTER TABLE variant_attributes ADD COLUMN IF NOT EXISTS varieties TEXT DEFAULT '';
      ALTER TABLE variant_attributes ADD COLUMN IF NOT EXISTS variety_images TEXT DEFAULT '{}';
    `);
    columnsEnsured = true;
  } catch (err) {
    console.warn('[DB] Failed to ensure variant_attributes columns:', err);
  }
}

// Router middleware to always ensure columns exist
router.use(async (_req, _res, next) => {
  try {
    const db = await getDb();
    await ensureVariantAttributeColumns(db);
  } catch (err) {
    console.warn('[DB] Error in variant attributes column middleware:', err);
  }
  next();
});

// GET /api/variant-attributes
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    await ensureVariantAttributeColumns(db);
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

      let vImages: Record<string, string> = {};
      if (row.value_images) {
        if (typeof row.value_images === 'object' && row.value_images !== null) {
          vImages = row.value_images;
        } else if (typeof row.value_images === 'string') {
          try {
            vImages = JSON.parse(row.value_images);
          } catch {
            vImages = {};
          }
        }
      }

      let varImages: Record<string, string> = {};
      if (row.variety_images) {
        if (typeof row.variety_images === 'object' && row.variety_images !== null) {
          varImages = row.variety_images;
        } else if (typeof row.variety_images === 'string') {
          try {
            varImages = JSON.parse(row.variety_images);
          } catch {
            varImages = {};
          }
        }
      }

      const isMappedToBoth = row.business_id === 'all' || bIds.length >= 2;

      return {
        ...row,
        business_ids: bIds,
        pattern_images: pImages,
        value_images: vImages,
        variety_images: Object.keys(varImages).length > 0 ? varImages : vImages,
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

    let vImages: Record<string, string> = {};
    if (row.value_images) {
      if (typeof row.value_images === 'object' && row.value_images !== null) {
        vImages = row.value_images;
      } else if (typeof row.value_images === 'string') {
        try {
          vImages = JSON.parse(row.value_images);
        } catch {
          vImages = {};
        }
      }
    }

    let varImages: Record<string, string> = {};
    if (row.variety_images) {
      if (typeof row.variety_images === 'object' && row.variety_images !== null) {
        varImages = row.variety_images;
      } else if (typeof row.variety_images === 'string') {
        try {
          varImages = JSON.parse(row.variety_images);
        } catch {
          varImages = {};
        }
      }
    }

    res.json({
      ...row,
      business_ids: bIds,
      pattern_images: pImages,
      value_images: vImages,
      variety_images: Object.keys(varImages).length > 0 ? varImages : vImages,
      is_mapped_to_both: row.business_id === 'all' || bIds.length >= 2
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/variant-attributes
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      values,
      patterns,
      pattern_images,
      value_images,
      attribute_type,
      product_id,
      product_name,
      category,
      sizes,
      varieties,
      variety_images,
      status,
      business_ids,
      business_id
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Variant attribute name is required' });
    }

    const effectiveValues = (values && values.trim()) || (varieties && varieties.trim()) || '';
    if (!effectiveValues && (!sizes || !sizes.trim())) {
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
    await ensureVariantAttributeColumns(db);
    const id = `va-${primaryBizId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Normalize comma-separated values (clean whitespace)
    const normalizedValues = effectiveValues
      ? effectiveValues
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0)
          .join(', ')
      : '';

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

    const normalizedValueImages = value_images && typeof value_images === 'object'
      ? JSON.stringify(value_images)
      : (typeof value_images === 'string' ? value_images : '{}');

    const normalizedSizes = sizes
      ? sizes
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
          .join(', ')
      : '';

    const normalizedVarieties = varieties
      ? varieties
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0)
          .join(', ')
      : normalizedValues;

    const normalizedVarietyImages = variety_images && typeof variety_images === 'object'
      ? JSON.stringify(variety_images)
      : (typeof variety_images === 'string' ? variety_images : normalizedValueImages);

    const finalAttrType = attribute_type === 'product_based' ? 'product_based' : 'general';
    const finalProductId = product_id ? String(product_id).trim() : '';
    const finalProductName = product_name ? String(product_name).trim() : '';
    const finalCategory = category ? String(category).trim() : '';

    const result = await db.query(
      `INSERT INTO variant_attributes (
        id, business_id, business_ids, name, values, patterns, pattern_images, value_images,
        attribute_type, product_id, product_name, category, sizes, varieties, variety_images, status
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        id,
        primaryBizId,
        JSON.stringify(finalBizIds),
        name.trim(),
        normalizedValues,
        normalizedPatterns,
        normalizedPatternImages,
        normalizedValueImages,
        finalAttrType,
        finalProductId,
        finalProductName,
        finalCategory,
        normalizedSizes,
        normalizedVarieties,
        normalizedVarietyImages,
        status || 'Active'
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      business_ids: finalBizIds,
      pattern_images: pattern_images || {},
      value_images: value_images || {},
      variety_images: variety_images || value_images || {},
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
    const {
      name,
      values,
      patterns,
      pattern_images,
      value_images,
      attribute_type,
      product_id,
      product_name,
      category,
      sizes,
      varieties,
      variety_images,
      status,
      business_ids,
      business_id
    } = req.body;
    const db = await getDb();
    await ensureVariantAttributeColumns(db);

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

    let normalizedValueImages: string | undefined = undefined;
    if (value_images !== undefined) {
      normalizedValueImages = typeof value_images === 'object'
        ? JSON.stringify(value_images)
        : String(value_images);
    }

    let normalizedSizes: string | undefined = undefined;
    if (sizes !== undefined) {
      normalizedSizes = sizes
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
        .join(', ');
    }

    let normalizedVarieties: string | undefined = undefined;
    if (varieties !== undefined) {
      normalizedVarieties = varieties
        .split(',')
        .map((v: string) => v.trim())
        .filter((v: string) => v.length > 0)
        .join(', ');
    }

    let normalizedVarietyImages: string | undefined = undefined;
    if (variety_images !== undefined) {
      normalizedVarietyImages = typeof variety_images === 'object'
        ? JSON.stringify(variety_images)
        : String(variety_images);
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
        value_images = COALESCE($5, value_images),
        attribute_type = COALESCE($6, attribute_type),
        product_id = COALESCE($7, product_id),
        product_name = COALESCE($8, product_name),
        category = COALESCE($9, category),
        sizes = COALESCE($10, sizes),
        varieties = COALESCE($11, varieties),
        variety_images = COALESCE($12, variety_images),
        status = COALESCE($13, status),
        business_id = COALESCE($14, business_id),
        business_ids = COALESCE($15, business_ids),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING *`,
      [
        name ? name.trim() : undefined,
        normalizedValues !== undefined ? normalizedValues : undefined,
        normalizedPatterns !== undefined ? normalizedPatterns : undefined,
        normalizedPatternImages !== undefined ? normalizedPatternImages : undefined,
        normalizedValueImages !== undefined ? normalizedValueImages : undefined,
        attribute_type !== undefined ? attribute_type : undefined,
        product_id !== undefined ? String(product_id).trim() : undefined,
        product_name !== undefined ? String(product_name).trim() : undefined,
        category !== undefined ? String(category).trim() : undefined,
        normalizedSizes !== undefined ? normalizedSizes : undefined,
        normalizedVarieties !== undefined ? normalizedVarieties : undefined,
        normalizedVarietyImages !== undefined ? normalizedVarietyImages : undefined,
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

    let pImages: Record<string, string> = {};
    if (updated.pattern_images) {
      try {
        pImages = typeof updated.pattern_images === 'object' ? updated.pattern_images : JSON.parse(updated.pattern_images);
      } catch {
        pImages = {};
      }
    }

    let vImages: Record<string, string> = {};
    if (updated.value_images) {
      try {
        vImages = typeof updated.value_images === 'object' ? updated.value_images : JSON.parse(updated.value_images);
      } catch {
        vImages = {};
      }
    }

    res.json({
      ...updated,
      business_ids: bIds,
      pattern_images: pImages,
      value_images: vImages,
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
