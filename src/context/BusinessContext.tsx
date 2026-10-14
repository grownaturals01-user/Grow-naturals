/**
 * GrowNaturals Billing — Dynamic Multi-Business Context & Header Switcher
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Business, BusinessId } from '../types';
import { api, getActiveBusinessId, setActiveBusinessId } from '../services/api';

interface BusinessContextType {
  businessId: BusinessId;
  business: Business | null;
  activeBusiness: Business;
  businesses: Business[];
  isTaxable: boolean;
  switchBusiness: (id: BusinessId) => void;
  refreshBusiness: () => Promise<void>;
  reloadBusinesses: () => Promise<void>;
  createBusiness: (data: Partial<Business>) => Promise<Business>;
  deleteBusiness: (id: string) => Promise<void>;
  isBizActive: (bizOrId: Business | string) => boolean;
  setBusinessStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
  activateAllBusinesses: () => Promise<void>;
}

const allBusinessObj: Business = {
  id: 'all',
  name: 'All Businesses',
  legal_name: 'All Combined Businesses (Both Stores Active)',
  gstin: '',
  address: 'Central Aggregated System',
  phone: '',
  email: '',
  invoice_prefix: 'ALL-',
  invoice_footer: '',
  logo_url: '',
  currency: 'INR',
  default_low_stock: 10,
  is_taxable: true,
  status: 'active',
  is_active: true
};

const STATUS_STORAGE_KEY = 'gn_business_statuses';

const getStoredStatuses = (): Record<string, 'active' | 'inactive'> => {
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setStoredStatus = (id: string, status: 'active' | 'inactive') => {
  try {
    const current = getStoredStatuses();
    current[id] = status;
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to save status to localStorage:', e);
  }
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businessId, setBusinessIdState] = useState<BusinessId>(() => {
    return (getActiveBusinessId() as BusinessId) || 'all';
  });

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  const isBizActive = useCallback((bizOrId: Business | string): boolean => {
    const id = typeof bizOrId === 'string' ? bizOrId : bizOrId.id;
    if (id === 'all') return true;

    const stored = getStoredStatuses();
    if (stored[id] !== undefined) {
      return stored[id] === 'active';
    }

    if (typeof bizOrId !== 'string') {
      return bizOrId.status !== 'inactive' && bizOrId.is_active !== false;
    }

    const found = businesses.find(b => b.id === id);
    if (found) {
      return found.status !== 'inactive' && found.is_active !== false;
    }

    // Default to active for standard seed businesses and all registered stores
    return true;
  }, [businesses]);

  const fetchBusinesses = useCallback(async () => {
    try {
      const list: Business[] = await api.get('/businesses');
      const stored = getStoredStatuses();

      // Ensure every business has an explicit status (defaulting to active)
      const normalizedList = list.map((b) => {
        const localStatus = stored[b.id];
        const status = localStatus !== undefined
          ? localStatus
          : (b.status === 'inactive' ? 'inactive' : 'active');
        return {
          ...b,
          status: status as 'active' | 'inactive',
          is_active: status === 'active',
        };
      });

      setBusinesses(normalizedList);

      if (businessId === 'all') {
        setBusiness(allBusinessObj);
        return;
      }

      let current = normalizedList.find((b: Business) => b.id === businessId);
      if (!current && normalizedList.length > 0) {
        current = normalizedList[0];
        setBusinessIdState(current.id);
        setActiveBusinessId(current.id);
      }

      if (current) {
        setBusiness(current);
      }
    } catch (err) {
      console.warn('Failed to load businesses:', err);
    }
  }, [businessId]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const switchBusiness = (id: BusinessId) => {
    setBusinessIdState(id);
    setActiveBusinessId(id);
    if (id === 'all') {
      setBusiness(allBusinessObj);
      return;
    }
    const selected = businesses.find((b) => b.id === id);
    if (selected) {
      setBusiness(selected);
    }
  };

  const refreshBusiness = async () => {
    await fetchBusinesses();
  };

  const setBusinessStatus = async (id: string, status: 'active' | 'inactive') => {
    setStoredStatus(id, status);
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status, is_active: status === 'active' } : b
      )
    );

    try {
      const target = businesses.find((b) => b.id === id);
      if (target) {
        await api.put(`/businesses/${id}`, {
          ...target,
          status,
          is_active: status === 'active',
        });
      }
    } catch (err) {
      console.warn('Could not persist status to backend API, kept in local storage:', err);
    }

    await fetchBusinesses();
  };

  const activateAllBusinesses = async () => {
    for (const b of businesses) {
      setStoredStatus(b.id, 'active');
    }
    setBusinesses((prev) =>
      prev.map((b) => ({ ...b, status: 'active', is_active: true }))
    );

    try {
      for (const b of businesses) {
        await api.put(`/businesses/${b.id}`, {
          ...b,
          status: 'active',
          is_active: true,
        });
      }
    } catch (err) {
      console.warn('Could not persist all statuses to API:', err);
    }

    await fetchBusinesses();
  };

  const createBusiness = async (data: Partial<Business>): Promise<Business> => {
    const payload = {
      ...data,
      status: data.status || 'active',
      is_active: data.status !== 'inactive',
    };
    const created: Business = await api.post('/businesses', payload);
    setStoredStatus(created.id, 'active');
    await fetchBusinesses();
    switchBusiness(created.id);
    return created;
  };

  const deleteBusiness = async (id: string): Promise<void> => {
    await api.delete(`/businesses/${id}`);
    const remaining = businesses.filter(b => b.id !== id);
    setBusinesses(remaining);
    if (businessId === id && remaining.length > 0) {
      switchBusiness(remaining[0].id);
    }
    await fetchBusinesses();
  };

  const activeBusiness: Business = useMemo(() => {
    if (business) return business;
    if (businessId === 'all') return allBusinessObj;
    const found = businesses.find((b) => b.id === businessId);
    if (found) return found;
    if (businesses.length > 0) return businesses[0];
    return {
      id: businessId,
      name: businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery',
      legal_name: businessId === 'grow-naturals' ? 'Grow Naturals Private Limited' : 'Nikhlesh Nursery & Farm',
      gstin: businessId === 'grow-naturals' ? '27AAAAA0000A1Z5' : '',
      address: 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu',
      phone: businessId === 'grow-naturals' ? '+91 98220 12345' : '+91 98220 54321',
      email: businessId === 'grow-naturals' ? 'billing@grownaturals.in' : 'sales@nikhleshnursery.in',
      invoice_prefix: businessId === 'grow-naturals' ? 'GN00' : 'NN00',
      invoice_footer: businessId === 'grow-naturals' ? 'Thank you for choosing Grow Naturals! All goods subject to warranty.' : 'Thank you for choosing Nikhlesh Nursery! 100% genuine saplings and plants.',
      logo_url: '',
      currency: 'INR',
      default_low_stock: 10,
      is_taxable: businessId === 'grow-naturals',
      status: 'active',
      is_active: true
    };
  }, [business, businessId, businesses]);

  const isTaxable = activeBusiness.is_taxable !== undefined
    ? Boolean(activeBusiness.is_taxable)
    : (activeBusiness.id === 'grow-naturals');

  return (
    <BusinessContext.Provider
      value={{
        businessId,
        business,
        activeBusiness,
        businesses,
        isTaxable,
        switchBusiness,
        refreshBusiness,
        reloadBusinesses: refreshBusiness,
        createBusiness,
        deleteBusiness,
        isBizActive,
        setBusinessStatus,
        activateAllBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export function useBusiness(): BusinessContextType {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
