/**
 * GrowNaturals Billing — Dynamic Multi-Business Context & Header Switcher
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businessId, setBusinessIdState] = useState<BusinessId>(() => {
    return (getActiveBusinessId() as BusinessId) || 'grow-naturals';
  });

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  const fetchBusinesses = useCallback(async () => {
    try {
      const list: Business[] = await api.get('/businesses');
      setBusinesses(list);

      let current = list.find((b: Business) => b.id === businessId);
      if (!current && list.length > 0) {
        current = list[0];
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
    const selected = businesses.find((b) => b.id === id);
    if (selected) {
      setBusiness(selected);
    }
  };

  const refreshBusiness = async () => {
    await fetchBusinesses();
  };

  const createBusiness = async (data: Partial<Business>): Promise<Business> => {
    const created: Business = await api.post('/businesses', data);
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

  const defaultActive: Business = {
    id: businessId,
    name: businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery',
    legal_name: businessId === 'grow-naturals' ? 'Grow Naturals Private Limited' : 'Nikhlesh Nursery & Farm',
    gstin: businessId === 'grow-naturals' ? '27AAAAA0000A1Z5' : '',
    address: 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu',
    phone: businessId === 'grow-naturals' ? '+91 98220 12345' : '+91 98220 54321',
    email: businessId === 'grow-naturals' ? 'billing@grownaturals.in' : 'sales@nikhleshnursery.in',
    invoice_prefix: businessId === 'grow-naturals' ? 'GN-' : 'NN-',
    invoice_footer: businessId === 'grow-naturals' ? 'Thank you for choosing Grow Naturals! All goods subject to warranty.' : 'Thank you for choosing Nikhlesh Nursery! 100% genuine saplings and plants.',
    logo_url: '',
    currency: 'INR',
    default_low_stock: 10,
    is_taxable: businessId === 'grow-naturals'
  };

  const activeBusiness: Business =
    business ||
    businesses.find(b => b.id === businessId) ||
    businesses[0] ||
    defaultActive;

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
