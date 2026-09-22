import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/print/thermal
router.post('/thermal', async (req: Request, res: Response) => {
  try {
    const bill = req.body;

    // Try forwarding to local ESC/POS thermal printer server on port 3333
    try {
      const response = await fetch('http://localhost:3333/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill),
      });

      if (response.ok) {
        const result = await response.json();
        return res.json({ success: true, printed_via: 'escpos_bridge', result });
      }
    } catch (bridgeErr) {
      // ESC/POS bridge is optional or offline; counter falls back to browser 80mm print
    }

    res.json({
      success: true,
      printed_via: 'browser_fallback',
      message: 'Thermal printer bridge server not running on port 3333. Use browser 80mm receipt print dialog.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/print/status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const response = await fetch('http://localhost:3333/status').catch(() => null);
    if (response && response.ok) {
      return res.json({ online: true, port: 3333 });
    }
    res.json({ online: false, message: 'ESC/POS thermal bridge offline' });
  } catch {
    res.json({ online: false, message: 'ESC/POS thermal bridge offline' });
  }
});

export default router;
