/**
 * GrowNaturals Billing — Two-Business Context & Header Switcher
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
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
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businessId, setBusinessIdState] = useState<BusinessId>(() => {
    return (getActiveBusinessId() as BusinessId) || 'grow-naturals';
  });

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  const fetchBusinesses = async () => {
    try {
      const list = await api.get('/businesses');
      setBusinesses(list);
      const current = list.find((b: Business) => b.id === businessId);
      if (current) {
        setBusiness(current);
      }
    } catch (err) {
      console.warn('Failed to load businesses:', err);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [businessId]);

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

  const isTaxable = businessId === 'grow-naturals';

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
    default_low_stock: 10
  };

  const activeBusiness: Business = business || businesses.find(b => b.id === businessId) || defaultActive;

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
