/**
 * GrowNaturals Billing — Print Service
 */

import { api } from './api';

export interface PrintThermalResult {
  success: boolean;
  message?: string;
  printed_via?: string;
}

export const printService = {
  // Check if local ESC/POS thermal bridge server is running on port 3333
  async checkBridgeStatus(): Promise<boolean> {
    try {
      const res = await fetch('http://localhost:3333/health', { method: 'GET', signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Try printing via Node.js ESC/POS bridge server (80mm thermal receipt)
  async printThermal(billData: any): Promise<PrintThermalResult> {
    try {
      const res = await api.post('/print/thermal', billData);
      return res;
    } catch (err: any) {
      console.warn('ESC/POS server print failed, falling back to browser dialog:', err);
      return { success: false, message: err.message };
    }
  },

  // Standard browser print (works for both A4 invoices and 80mm thermal receipt view)
  printBrowser(): void {
    window.print();
  },
};
