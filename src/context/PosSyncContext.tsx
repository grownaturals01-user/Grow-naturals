/**
 * GrowNaturals Billing — POS Offline & Background Sync Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { posQueueService } from '../services/posQueue';
import { api } from '../services/api';
import type { OfflineSaleQueueItem } from '../types';

export type SyncStatus = 'synced' | 'syncing' | 'offline';

interface PosSyncContextType {
  isOnline: boolean;
  syncStatus: SyncStatus;
  queuedCount: number;
  triggerSync: () => Promise<void>;
  queueOfflineSale: (sale: Omit<OfflineSaleQueueItem, 'synced'>) => Promise<void>;
  refreshQueueCount: () => Promise<void>;
}

const PosSyncContext = createContext<PosSyncContextType | undefined>(undefined);

export const PosSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? 'synced' : 'offline');
  const [queuedCount, setQueuedCount] = useState<number>(0);

  const refreshQueueCount = useCallback(async () => {
    try {
      const count = await posQueueService.getQueuedCount();
      setQueuedCount(count);
      if (!navigator.onLine) {
        setSyncStatus('offline');
      } else if (count > 0) {
        setSyncStatus('syncing');
      } else {
        setSyncStatus('synced');
      }
    } catch {
      // ignore
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    try {
      const pending = await posQueueService.getUnsyncedSales();
      if (pending.length === 0) {
        setSyncStatus('synced');
        setQueuedCount(0);
        return;
      }

      setSyncStatus('syncing');
      const response = await api.post('/pos/sync', { sales: pending });

      if (response.success && response.synced_invoices) {
        await posQueueService.markSalesSynced(response.synced_invoices);
      }

      await refreshQueueCount();
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Sync attempt encountered an issue, will retry:', err);
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');
    }
  }, [refreshQueueCount]);

  const queueOfflineSale = async (sale: Omit<OfflineSaleQueueItem, 'synced'>) => {
    await posQueueService.queueSale(sale);
    await refreshQueueCount();

    // If online, try syncing immediately in background
    if (navigator.onLine) {
      triggerSync();
    }
  };

  useEffect(() => {
    refreshQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic sync poll every 30s
    const interval = setInterval(() => {
      if (navigator.onLine) {
        triggerSync();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [triggerSync, refreshQueueCount]);

  return (
    <PosSyncContext.Provider
      value={{
        isOnline,
        syncStatus,
        queuedCount,
        triggerSync,
        queueOfflineSale,
        refreshQueueCount,
      }}
    >
      {children}
    </PosSyncContext.Provider>
  );
};

export function usePosSync(): PosSyncContextType {
  const context = useContext(PosSyncContext);
  if (!context) {
    throw new Error('usePosSync must be used within a PosSyncProvider');
  }
  return context;
}
