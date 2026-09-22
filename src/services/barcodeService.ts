/**
 * GrowNaturals Billing — Barcode & QR Code Services
 */

import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export const barcodeService = {
  // Render Code128 barcode into an SVG or Canvas element
  renderBarcode(element: SVGElement | HTMLCanvasElement, text: string, options?: { height?: number; displayValue?: boolean }) {
    if (!element || !text) return;
    try {
      JsBarcode(element, text, {
        format: 'CODE128',
        height: options?.height || 40,
        displayValue: options?.displayValue ?? true,
        fontSize: 12,
        margin: 4,
        background: 'transparent',
        lineColor: '#0f172a',
      });
    } catch (err) {
      console.warn('Barcode render warning:', err);
    }
  },

  // Generate QR Code as Data URL
  async generateQRCode(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: 160,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (err) {
      console.error('QR code generation error:', err);
      return '';
    }
  },

  // Hardware USB Barcode Scanner Listener
  // Hardware scanners type fast character sequences (<50ms between keys) ending in 'Enter'
  attachScannerListener(onScan: (barcode: string) => void): () => void {
    let buffer = '';
    let lastKeyTime = 0;
    const SCAN_TIMEOUT = 60; // ms

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is actively typing inside an input other than general window, still check if it's super fast
      const currentTime = Date.now();

      if (e.key === 'Enter') {
        if (buffer.length >= 3 && (currentTime - lastKeyTime) < 150) {
          e.preventDefault();
          onScan(buffer.trim());
        }
        buffer = '';
        return;
      }

      if (e.key.length === 1) {
        if (currentTime - lastKeyTime > SCAN_TIMEOUT) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
        lastKeyTime = currentTime;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  },
};
