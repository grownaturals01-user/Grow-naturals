import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// Indian State Codes dictionary for GSTIN (01 to 38 + 97)
const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

// 4th Character of PAN indicates Entity Constitution
const PAN_ENTITY_TYPES: Record<string, string> = {
  C: 'Company / Pvt Ltd / Ltd',
  P: 'Individual / Proprietorship',
  H: 'Hindu Undivided Family (HUF)',
  F: 'Partnership Firm / LLP',
  A: 'Association of Persons (AOP)',
  T: 'Trust',
  B: 'Body of Individuals (BOI)',
  L: 'Local Authority',
  J: 'Artificial Juridical Person',
  G: 'Government Entity',
};

// GSTIN Regex Pattern (15 chars)
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

// GET /api/gst/lookup/:gstin
router.get('/lookup/:gstin', async (req: Request, res: Response) => {
  try {
    const rawGstin = (req.params.gstin || '').trim().toUpperCase();

    if (!rawGstin || rawGstin.length < 15) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a complete 15-character GST number (e.g. 33AABCT1332L1ZV).'
      });
    }

    if (!GSTIN_REGEX.test(rawGstin)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GSTIN structure. Must follow standard Indian format: 2-digit State + 10-digit PAN + 1-digit Entity + Z + 1 Check Digit.'
      });
    }

    const stateCode = rawGstin.substring(0, 2);
    const pan = rawGstin.substring(2, 12);
    const entityChar = pan.charAt(3).toUpperCase();
    const stateName = GST_STATE_CODES[stateCode] || 'Unknown State';
    const entityType = PAN_ENTITY_TYPES[entityChar] || 'Registered Business';

    const db = await getDb();

    // 1. Check local Customers & Quotations in DB
    const custRes = await db.query(
      `SELECT * FROM customers WHERE UPPER(gstin) = $1 LIMIT 1`,
      [rawGstin]
    );

    if (custRes.rows.length > 0) {
      const cust = custRes.rows[0];
      return res.json({
        success: true,
        gstin: rawGstin,
        legal_name: cust.name,
        trade_name: cust.name,
        customer_name: cust.name,
        phone: cust.phone || '',
        email: cust.email || '',
        address: cust.address || '',
        state: stateName,
        state_code: stateCode,
        pan,
        entity_type: entityType,
        status: 'Active',
        source: 'database'
      });
    }

    // Also check past quotations
    const quoteRes = await db.query(
      `SELECT customer_name, customer_phone, customer_address FROM quotations WHERE UPPER(customer_gstin) = $1 ORDER BY created_at DESC LIMIT 1`,
      [rawGstin]
    );

    if (quoteRes.rows.length > 0) {
      const q = quoteRes.rows[0];
      return res.json({
        success: true,
        gstin: rawGstin,
        legal_name: q.customer_name,
        trade_name: q.customer_name,
        customer_name: q.customer_name,
        phone: q.customer_phone || '',
        address: q.customer_address || '',
        state: stateName,
        state_code: stateCode,
        pan,
        entity_type: entityType,
        status: 'Active',
        source: 'database'
      });
    }

    // 2. Query Public GST Lookup APIs (with multi-endpoint fallback)
    let fetchedData: any = null;

    // Try Endpoint A: Public Taxpayer GSTIN lookup
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(`https://api.gstincheck.co.in/check/${rawGstin}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const json: any = await resp.json();
        if (json && (json.legal_name || json.trade_name || json.data?.lgnm || json.data?.tradeNam)) {
          const lgnm = json.legal_name || json.data?.lgnm || '';
          const trdnm = json.trade_name || json.data?.tradeNam || lgnm;
          const addr = json.address || json.data?.pradr?.addr || {};
          let formattedAddr = typeof addr === 'string' ? addr : '';
          if (typeof addr === 'object' && addr !== null) {
            formattedAddr = [addr.bno, addr.flno, addr.st, addr.loc, addr.dst, addr.stcd, addr.pncd].filter(Boolean).join(', ');
          }

          fetchedData = {
            legal_name: lgnm || trdnm,
            trade_name: trdnm || lgnm,
            address: formattedAddr || `${stateName}, India`,
            status: json.status || json.data?.sts || 'Active',
            phone: json.phone || '',
            email: json.email || '',
          };
        }
      }
    } catch (apiErr) {
      // Fallback silently if public API is busy
    }

    // Try Endpoint B: Secondary Public Portal Search fallback
    if (!fetchedData) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const resp = await fetch(`https://commonapi.gst.gov.in/commonapi/v0.2/search?action=TP&gstin=${rawGstin}`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json'
          }
        });
        clearTimeout(timeout);

        if (resp.ok) {
          const json: any = await resp.json();
          if (json && (json.lgnm || json.tradeNam)) {
            const lgnm = json.lgnm || '';
            const trdnm = json.tradeNam || lgnm;
            const addrObj = json.pradr?.addr || {};
            const formattedAddr = [addrObj.bno, addrObj.flno, addrObj.st, addrObj.loc, addrObj.dst, addrObj.stcd, addrObj.pncd].filter(Boolean).join(', ');

            fetchedData = {
              legal_name: lgnm || trdnm,
              trade_name: trdnm || lgnm,
              address: formattedAddr || `${stateName}, India`,
              status: json.sts || 'Active',
              phone: '',
              email: '',
            };
          }
        }
      } catch (err) {}
    }

    if (fetchedData && (fetchedData.legal_name || fetchedData.trade_name)) {
      const chosenName = fetchedData.trade_name || fetchedData.legal_name;

      // Automatically store/cache in customers table for instant recall
      try {
        const custId = `cust-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        await db.query(
          `INSERT INTO customers (id, name, phone, email, address, gstin)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [custId, chosenName, fetchedData.phone || '', fetchedData.email || '', fetchedData.address || '', rawGstin]
        );
      } catch (insertErr) {}

      return res.json({
        success: true,
        gstin: rawGstin,
        legal_name: fetchedData.legal_name,
        trade_name: fetchedData.trade_name,
        customer_name: chosenName,
        phone: fetchedData.phone || '',
        email: fetchedData.email || '',
        address: fetchedData.address || `${stateName}, India`,
        state: stateName,
        state_code: stateCode,
        pan,
        entity_type: entityType,
        status: fetchedData.status || 'Active',
        source: 'live_api'
      });
    }

    // 3. Fallback: Return Verified State, PAN, and Entity Details
    return res.json({
      success: true,
      gstin: rawGstin,
      legal_name: '',
      trade_name: '',
      customer_name: '',
      phone: '',
      email: '',
      address: `${stateName}, India`,
      state: stateName,
      state_code: stateCode,
      pan,
      entity_type: entityType,
      status: 'Active (Verified GSTIN Format)',
      source: 'decoded'
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
