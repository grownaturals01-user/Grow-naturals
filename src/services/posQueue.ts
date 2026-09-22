/**
 * GrowNaturals Billing — POS IndexedDB Offline Queue & Cache
 * Strictly used as an offline buffer & queue for POS counter operations.
 */

import Dexie, { type Table } from 'dexie';
import type { Product, OfflineSaleQueueItem, HeldBill, BusinessId } from '../types';

export class PosOfflineDatabase extends Dexie {
  offline_sales_queue!: Table<OfflineSaleQueueItem, string>;
  cached_products!: Table<Product, string>;
  held_bills!: Table<HeldBill, string>;

  constructor() {
    super('GrowNaturalsPosQueueDB');
    this.version(1).stores({
      offline_sales_queue: 'id, business_id, invoice_number, synced, created_at',
      cached_products: 'id, business_id, name, sku, barcode, type',
      held_bills: 'id, business_id, hold_number, saved_at',
    });
  }
}

export const posDb = new PosOfflineDatabase();

export const posQueueService = {
  // Queue a sale when offline
  async queueSale(sale: Omit<OfflineSaleQueueItem, 'synced'>): Promise<void> {
    await posDb.offline_sales_queue.put({
      ...sale,
      synced: false,
    });
  },

  // Get all pending unsynced sales
  async getUnsyncedSales(): Promise<OfflineSaleQueueItem[]> {
    return posDb.offline_sales_queue.where('synced').equals(0).or('synced').equals(false as any).toArray();
  },

  // Get count of queued offline sales
  async getQueuedCount(): Promise<number> {
    return posDb.offline_sales_queue.where('synced').equals(0).or('synced').equals(false as any).count();
  },

  // Mark sales as synced or remove them
  async markSalesSynced(invoiceNumbers: string[]): Promise<void> {
    for (const num of invoiceNumbers) {
      const match = await posDb.offline_sales_queue.where('invoice_number').equals(num).first();
      if (match) {
        await posDb.offline_sales_queue.delete(match.id);
      }
    }
  },

  // Cache products for offline lookups
  async cacheProducts(products: Product[]): Promise<void> {
    if (!products || products.length === 0) return;
    await posDb.cached_products.bulkPut(products);
  },

  // Get cached products for active business
  async getCachedProducts(businessId: BusinessId): Promise<Product[]> {
    return posDb.cached_products.where('business_id').equals(businessId).toArray();
  },

  // Hold bills
  async holdBill(bill: HeldBill): Promise<void> {
    await posDb.held_bills.put(bill);
  },

  async getHeldBills(businessId: BusinessId): Promise<HeldBill[]> {
    return posDb.held_bills.where('business_id').equals(businessId).toArray();
  },

  async deleteHeldBill(id: string): Promise<void> {
    await posDb.held_bills.delete(id);
  },
};
