import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useBusiness } from './BusinessContext';
import { api } from '../services/api';
import type { InventoryModule } from '../types';

interface InventoryModulesContextType {
  modules: InventoryModule[];
  isLoading: boolean;
  addModule: (moduleData: { name: string; caption?: string; icon?: string; image_url?: string; slug?: string; sort_order?: number }) => Promise<InventoryModule>;
  updateModule: (id: string, moduleData: { name: string; caption?: string; icon?: string; image_url?: string; sort_order?: number }) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  refreshModules: () => Promise<void>;
  getModuleBySlug: (slug: string) => InventoryModule | undefined;
}

const InventoryModulesContext = createContext<InventoryModulesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'gn_inv_modules_';

export const InventoryModulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { businessId } = useBusiness();
  const [modules, setModules] = useState<InventoryModule[]>(() => {
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${businessId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchModules = useCallback(async () => {
    if (!businessId) return;
    try {
      setIsLoading(true);
      const data: InventoryModule[] = await api.get('/inventory-modules', { business_id: businessId });
      if (Array.isArray(data)) {
        setModules(data);
        try {
          localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${businessId}`, JSON.stringify(data));
        } catch {}
      }
    } catch (err) {
      console.warn('[InventoryModules] Failed to fetch modules from server, using cached if available:', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${businessId}`);
      if (cached) {
        setModules(JSON.parse(cached));
      } else {
        setModules([]);
      }
    } catch {}
    fetchModules();
  }, [businessId, fetchModules]);

  const addModule = async (moduleData: { name: string; caption?: string; icon?: string; image_url?: string; slug?: string }): Promise<InventoryModule> => {
    const payload = {
      business_id: businessId,
      name: moduleData.name.trim(),
      caption: moduleData.caption?.trim() || '',
      icon: moduleData.icon || '📦',
      image_url: moduleData.image_url?.trim() || '',
      slug: moduleData.slug?.trim() || '',
    };

    let newModule: InventoryModule;
    try {
      newModule = await api.post('/inventory-modules', payload);
    } catch (err) {
      // Fallback local creation if offline
      const slug = payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      newModule = {
        id: `inv-mod-local-${Date.now()}`,
        business_id: businessId,
        name: payload.name,
        slug,
        caption: payload.caption,
        icon: payload.icon,
        image_url: payload.image_url,
        sort_order: modules.length + 1,
        created_at: new Date().toISOString(),
      };
    }

    setModules((prev) => {
      const updated = [...prev.filter((m) => m.slug !== newModule.slug), newModule];
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${businessId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    return newModule;
  };

  const deleteModule = async (id: string): Promise<void> => {
    try {
      await api.delete(`/inventory-modules/${id}`);
    } catch (err) {
      console.warn('Failed to delete on server:', err);
    }

    setModules((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${businessId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateModule = async (id: string, moduleData: { name: string; caption?: string; icon?: string; image_url?: string; sort_order?: number }): Promise<void> => {
    try {
      await api.put(`/inventory-modules/${id}`, moduleData);
    } catch (err) {
      console.warn('Failed to update on server:', err);
    }

    setModules((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, ...moduleData, name: moduleData.name.trim(), caption: moduleData.caption?.trim() || '' } : m));
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${businessId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const getModuleBySlug = (slug: string): InventoryModule | undefined => {
    return modules.find((m) => m.slug.toLowerCase() === slug.toLowerCase());
  };

  return (
    <InventoryModulesContext.Provider
      value={{
        modules,
        isLoading,
        addModule,
        updateModule,
        deleteModule,
        refreshModules: fetchModules,
        getModuleBySlug,
      }}
    >
      {children}
    </InventoryModulesContext.Provider>
  );
};

export const useInventoryModules = () => {
  const context = useContext(InventoryModulesContext);
  if (!context) {
    throw new Error('useInventoryModules must be used within an InventoryModulesProvider');
  }
  return context;
};
