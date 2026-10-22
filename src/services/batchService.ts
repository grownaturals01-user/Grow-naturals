/**
 * GrowNaturals Billing — Purchase & Batch Management Service
 * Manages batches, purchase entries, expense calculations, and product mappings.
 */

import { string } from "prop-types";

export interface PurchaseItem {
  id: string;
  invoiceId?: string;
  invoicePo?: string;
  productId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  quantity: number;
  remainingQty: number; // Stock left in batch
  unit?: string;
  purchasePrice: number; // Bill value per unit
  sellingPrice: number; // Selling price per unit
  actualCost: number; // Calculated per unit based on batch expense %
}

export interface CustomExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export interface ExpenseBreakdown {
  freight?: number;
  labour?: number;
  transport?: number;
  packaging?: number;
  other?: number;
  customExpenses?: CustomExpenseItem[];
}

export interface BatchRecord {
  id: string;
  batchNo: string; // Unique Branch ID / Batch Number
  branchId?: string; // Branch ID (e.g. BRANCH-2026-001)
  branchName?: string; // Branch Name (e.g. Main Branch, Warehouse A)
  purchaseDate: string; // Branch Created Date / Purchase Date
  supplierId?: string;
  supplierName: string;
  invoiceNo: string;
  invoiceId?: string;
  invoiceIds?: string[];
  invoiceNos?: string[];
  invoiceDate?: string;
  invoiceTotal?: number;
  damageCost?: number; // Cost of Damage tracked from damage tracking
  damageUnits?: number;
  notes?: string;
  items: PurchaseItem[];
  totalPurchaseValue: number;
  totalExpenseAmount: number;
  expenseBreakdown?: ExpenseBreakdown;
  expensePercent: number; // (Total Expense ÷ Purchase Price) × 100
  createdAt: string;
}

const STORAGE_KEY = 'gn_purchase_batches';

const INITIAL_BATCHES: BatchRecord[] = [];

export const batchService = {
  getBatches(): BatchRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed: BatchRecord[] = JSON.parse(stored);
      // Clean out legacy mock/dump batches
      const cleaned = parsed.filter((b) => b.id !== 'batch-1' && b.id !== 'batch-2');
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  getBatchById(id: string): BatchRecord | undefined {
    const batches = this.getBatches();
    return batches.find((b) => b.id === id || b.batchNo === id);
  },

  isBatchNameUnique(batchNo: string, excludeId?: string): boolean {
    const batches = this.getBatches();
    const cleanName = batchNo.trim().toLowerCase();
    return !batches.some(
      (b) => b.batchNo.trim().toLowerCase() === cleanName && b.id !== excludeId
    );
  },

  saveBatch(batch: BatchRecord): BatchRecord {
    const batches = this.getBatches();
    const existingIndex = batches.findIndex((b) => b.id === batch.id);

    if (existingIndex >= 0) {
      batches[existingIndex] = { ...batch };
    } else {
      batches.unshift(batch);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
    return batch;
  },

  deleteBatch(id: string): boolean {
    const batches = this.getBatches();
    const filtered = batches.filter((b) => b.id !== id);
    if (filtered.length !== batches.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  /**
   * Find all batch items linked to a given product (by id, sku, or name)
   */
  getBatchesForProduct(
    productId?: string | number,
    sku?: string,
    productName?: string
  ): Array<{ batch: BatchRecord; item: PurchaseItem }> {
    const batches = this.getBatches();
    const results: Array<{ batch: BatchRecord; item: PurchaseItem }> = [];

    const strId = productId !== undefined && productId !== null ? String(productId) : '';
    const cleanSku = (sku || '').trim().toLowerCase();
    const cleanName = (productName || '').trim().toLowerCase();

    batches.forEach((batch) => {
      batch.items.forEach((item) => {
        const itemProdId = item.productId ? String(item.productId) : '';
        const itemSku = (item.sku || '').trim().toLowerCase();
        const itemName = (item.productName || '').trim().toLowerCase();

        const matchId = strId && itemProdId === strId;
        const matchSku = cleanSku && itemSku === cleanSku;
        const matchName = cleanName && itemName === cleanName;

        if (matchId || matchSku || matchName) {
          results.push({ batch, item });
        }
      });
    });

    return results;
  },

  /**
   * Helper calculation to compute expense percentage and item actual costs
   */
  calculateBatch(items: PurchaseItem[], totalExpense: number): {
    totalPurchaseValue: number;
    expensePercent: number;
    calculatedItems: PurchaseItem[];
  } {
    const totalPurchaseValue = items.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.purchasePrice) || 0),
      0
    );

    const expensePercent =
      totalPurchaseValue > 0
        ? Number(((totalExpense / totalPurchaseValue) * 100).toFixed(2))
        : 0;

    const calculatedItems = items.map((it) => {
      const price = Number(it.purchasePrice) || 0;
      const actualCost =
        expensePercent > 0
          ? Number((price + (price * expensePercent) / 100).toFixed(2))
          : price;

      return {
        ...it,
        actualCost,
      };
    });

    return {
      totalPurchaseValue,
      expensePercent,
      calculatedItems,
    };
  },
};
