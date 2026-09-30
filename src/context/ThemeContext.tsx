/**
 * GrowNaturals Billing — Complete DreamsPOS Theme Customizer Engine
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type LayoutMode = 'default' | 'mini' | 'twocolumn' | 'horizontal' | 'detached' | 'without-header' | 'rtl';
export type LayoutWidth = 'fluid' | 'box';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  hover: string;
  light: string;
  subtle: string;
  border: string;
}

export const THEME_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'primary',
    name: 'DreamsPOS Orange',
    primary: '#FE9F43',
    hover: '#E58830',
    light: '#FFF6EE',
    subtle: '#FFEDDD',
    border: '#FFDABA',
  },
  {
    id: 'brightblue',
    name: 'Bright Teal Green',
    primary: '#009688',
    hover: '#00796B',
    light: '#E0F2F1',
    subtle: '#B2DFDB',
    border: '#80CBC4',
  },
  {
    id: 'lunargreen',
    name: 'Lunar Red',
    primary: '#D63031',
    hover: '#B71C1C',
    light: '#FFEBEE',
    subtle: '#FFCDD2',
    border: '#EF9A9A',
  },
  {
    id: 'lavendar',
    name: 'Lavender Purple',
    primary: '#6C5CE7',
    hover: '#5A4BD1',
    light: '#F3E8FF',
    subtle: '#E9D5FF',
    border: '#D8B4FE',
  },
  {
    id: 'magenta',
    name: 'Ocean Blue',
    primary: '#0984E3',
    hover: '#0770C2',
    light: '#E0F2FE',
    subtle: '#BAE6FD',
    border: '#7DD3FC',
  },
  {
    id: 'chromeyellow',
    name: 'Emerald Mint',
    primary: '#00B894',
    hover: '#00A383',
    light: '#E6F9F5',
    subtle: '#B3EFE3',
    border: '#80E5D1',
  },
  {
    id: 'orange',
    name: 'Deep Orange',
    primary: '#E04F16',
    hover: '#C23E0C',
    light: '#FFF0EB',
    subtle: '#FFE0D6',
    border: '#FFC2AD',
  },
];

export const TOPBAR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  white: { bg: '#FFFFFF', text: '#111827', border: '#E5E7EB' },
  topbarcolorone: { bg: '#116D6E', text: '#FFFFFF', border: '#0E5859' },
  topbarcolortwo: { bg: '#F0E4D7', text: '#111827', border: '#E2D5C5' },
  topbarcolorthree: { bg: '#8CB9BD', text: '#111827', border: '#7EA9AD' },
  topbarcolorfour: { bg: '#B5C0D0', text: '#111827', border: '#A4B0C2' },
  topbarcolorfive: { bg: '#6C0BA9', text: '#FFFFFF', border: '#59088D' },
  topcolorsix: { bg: '#0B897D', text: '#FFFFFF', border: '#086E64' },
  topbarcolorsix: { bg: '#0B897D', text: '#FFFFFF', border: '#086E64' },
  topbarcolorseven: { bg: 'linear-gradient(180deg, #4B749F 0%, #243748 100%)', text: '#FFFFFF', border: 'transparent' },
  topbarcoloreight: { bg: 'linear-gradient(180deg, #18ACCF 0%, #0F59AD 100%)', text: '#FFFFFF', border: 'transparent' },
  topbarcolornine: { bg: 'linear-gradient(180deg, #7D90B8 0%, #103783 100%)', text: '#FFFFFF', border: 'transparent' },
  topbarcolorten: { bg: 'linear-gradient(180deg, #8E4BEB 0%, #472282 100%)', text: '#FFFFFF', border: 'transparent' },
  topbarcoloreleven: { bg: 'linear-gradient(180deg, #309F92 0%, #0C5666 100%)', text: '#FFFFFF', border: 'transparent' },
  topbarcolortwelve: { bg: 'linear-gradient(90deg, #FF9966 1.92%, #FF5E62 100%)', text: '#FFFFFF', border: 'transparent' },
  topbarcolorthirteen: { bg: 'linear-gradient(90deg, #760762 1.92%, #883907 100%)', text: '#FFFFFF', border: 'transparent' },
  topbarcolorfourteen: { bg: 'linear-gradient(90deg, #4471CC 1.92%, #AE7BD4 100%)', text: '#FFFFFF', border: 'transparent' },
};

export const SIDEBAR_COLORS: Record<string, { bg: string; text: string; muted: string; border: string; hover: string }> = {
  light: { bg: '#FFFFFF', text: '#4B5563', muted: '#9CA3AF', border: '#E5E7EB', hover: '#FFF6EE' },
  sidebarcolorone: { bg: '#FBFBFB', text: '#334155', muted: '#94A3B8', border: '#E2E8F0', hover: 'rgba(0,0,0,0.05)' },
  sidebarcolortwo: { bg: '#505969', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: '#3F4754', hover: 'rgba(255,255,255,0.12)' },
  sidebarcolorthree: { bg: '#2C2C2C', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: '#1F1F1F', hover: 'rgba(255,255,255,0.12)' },
  sidebarcolorfour: { bg: '#1D51B6', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: '#153F91', hover: 'rgba(255,255,255,0.15)' },
  sidebarcolorfive: { bg: '#6C0BA9', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: '#550885', hover: 'rgba(255,255,255,0.15)' },
  sidebarcolorsix: { bg: '#0B897D', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: '#08695F', hover: 'rgba(255,255,255,0.15)' },
  sidebarcolorseven: { bg: 'linear-gradient(180deg, #4B749F 0%, #243748 100%)', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: 'transparent', hover: 'rgba(255,255,255,0.12)' },
  sidebarcoloreight: { bg: 'linear-gradient(180deg, #18ACCF 0%, #0F59AD 100%)', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: 'transparent', hover: 'rgba(255,255,255,0.12)' },
  sidebarcolornine: { bg: 'linear-gradient(180deg, #7D90B8 0%, #103783 100%)', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: 'transparent', hover: 'rgba(255,255,255,0.12)' },
  sidebarcolorten: { bg: 'linear-gradient(180deg, #8E4BEB 0%, #472282 100%)', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: 'transparent', hover: 'rgba(255,255,255,0.12)' },
  sidebarcoloreleven: { bg: 'linear-gradient(180deg, #309F92 0%, #0C5666 100%)', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: 'transparent', hover: 'rgba(255,255,255,0.12)' },
  sidebarcolortwelve: { bg: 'linear-gradient(90deg, #FF9966 1.92%, #FF5E62 100%)', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: 'transparent', hover: 'rgba(255,255,255,0.15)' },
  sidebarcolorthirteen: { bg: 'linear-gradient(90deg, #760762 1.92%, #883907 100%)', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: 'transparent', hover: 'rgba(255,255,255,0.15)' },
  sidebarcolorfourteen: { bg: 'linear-gradient(90deg, #4471CC 1.92%, #AE7BD4 100%)', text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', border: 'transparent', hover: 'rgba(255,255,255,0.15)' },
};

interface ThemeContextType {
  dataLayout: LayoutMode;
  setDataLayout: (layout: LayoutMode) => void;
  dataWidth: LayoutWidth;
  setDataWidth: (width: LayoutWidth) => void;
  dataTheme: ThemeMode;
  setDataTheme: (theme: ThemeMode) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  dataTopBar: string;
  setDataTopBar: (color: string) => void;
  dataSidebar: string;
  setDataSidebar: (color: string) => void;
  dataColor: string;
  setDataColor: (color: string) => void;
  customColor: string;
  setCustomColor: (color: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isCustomizerOpen: boolean;
  openCustomizer: () => void;
  closeCustomizer: () => void;
  resetAllMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataLayout, setDataLayoutState] = useState<LayoutMode>(() => {
    return (localStorage.getItem('dataLayout') as LayoutMode) || 'default';
  });

  const [dataWidth, setDataWidthState] = useState<LayoutWidth>(() => {
    return (localStorage.getItem('dataWidth') as LayoutWidth) || 'fluid';
  });

  const [dataTheme, setDataThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('dataTheme') as ThemeMode) || 'light';
  });

  const [dataTopBar, setDataTopBarState] = useState<string>(() => {
    return localStorage.getItem('dataTopBar') || 'white';
  });

  const [dataSidebar, setDataSidebarState] = useState<string>(() => {
    return localStorage.getItem('dataSidebar') || 'light';
  });

  const [dataColor, setDataColorState] = useState<string>(() => {
    return localStorage.getItem('dataColor') || 'primary';
  });

  const [customColor, setCustomColorState] = useState<string>(() => {
    return localStorage.getItem('dataCustomColor') || '#FE9F43';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem('gn_sidebar_collapsed') === 'true' || localStorage.getItem('dataLayout') === 'mini';
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Setters with localStorage persistence
  const setDataLayout = (layout: LayoutMode) => {
    setDataLayoutState(layout);
    localStorage.setItem('dataLayout', layout);
    if (layout === 'mini') {
      setIsSidebarCollapsedState(true);
      localStorage.setItem('gn_sidebar_collapsed', 'true');
      document.body.classList.add('mini-sidebar');
    } else {
      setIsSidebarCollapsedState(false);
      localStorage.setItem('gn_sidebar_collapsed', 'false');
      document.body.classList.remove('mini-sidebar');
    }
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    localStorage.setItem('gn_sidebar_collapsed', String(collapsed));
    if (collapsed) {
      document.body.classList.add('mini-sidebar');
      setDataLayoutState('mini');
      localStorage.setItem('dataLayout', 'mini');
    } else {
      document.body.classList.remove('mini-sidebar');
      setDataLayoutState('default');
      localStorage.setItem('dataLayout', 'default');
    }
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const setDataWidth = (width: LayoutWidth) => {
    setDataWidthState(width);
    localStorage.setItem('dataWidth', width);
  };

  const setDataTheme = (theme: ThemeMode) => {
    setDataThemeState(theme);
    localStorage.setItem('dataTheme', theme);
  };

  const setDataTopBar = (color: string) => {
    setDataTopBarState(color);
    localStorage.setItem('dataTopBar', color);
  };

  const setDataSidebar = (color: string) => {
    setDataSidebarState(color);
    localStorage.setItem('dataSidebar', color);
  };

  const setDataColor = (color: string) => {
    setDataColorState(color);
    localStorage.setItem('dataColor', color);
  };

  const setCustomColor = (color: string) => {
    setCustomColorState(color);
    localStorage.setItem('dataCustomColor', color);
  };

  const toggleTheme = () => {
    const next = dataTheme === 'light' ? 'dark' : 'light';
    setDataTheme(next);
  };

  const resetAllMode = () => {
    setDataLayout('default');
    setDataWidth('fluid');
    setDataTheme('light');
    setDataTopBar('white');
    setDataSidebar('light');
    setDataColor('primary');
    setCustomColor('#FE9F43');
    setSidebarCollapsed(false);
  };

  // Resolve active theme (light or dark, handling system)
  const resolvedTheme: 'light' | 'dark' =
    dataTheme === 'system'
      ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : dataTheme;

  // Apply all dynamic CSS and DOM attributes
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // 1. Data attributes
    root.setAttribute('data-layout', dataLayout);
    root.setAttribute('data-width', dataWidth);
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-topbar', dataTopBar);
    root.setAttribute('data-sidebar', dataSidebar);
    root.setAttribute('data-color', dataColor);

    // 2. RTL Handling
    if (dataLayout === 'rtl') {
      root.setAttribute('dir', 'rtl');
      body.classList.add('layout-mode-rtl');
    } else {
      root.removeAttribute('dir');
      body.classList.remove('layout-mode-rtl');
    }

    // 3. Mini Sidebar class
    if (isSidebarCollapsed || dataLayout === 'mini') {
      body.classList.add('mini-sidebar');
    } else {
      body.classList.remove('mini-sidebar');
    }

    // 4. Primary Theme Color
    const preset = THEME_COLOR_PRESETS.find((p) => p.id === dataColor) || THEME_COLOR_PRESETS[0];
    if (dataColor === 'custom') {
      root.style.setProperty('--color-primary', customColor);
      root.style.setProperty('--color-primary-hover', customColor);
      root.style.setProperty('--color-primary-light', 'rgba(254, 159, 67, 0.12)');
      root.style.setProperty('--color-primary-subtle', 'rgba(254, 159, 67, 0.2)');
      root.style.setProperty('--color-primary-border', customColor);
      root.style.setProperty('--color-botanical-500', customColor);
      root.style.setProperty('--color-botanical-600', customColor);
      root.style.setProperty('--color-sidebar-active-bg', customColor);
    } else {
      root.style.setProperty('--color-primary', preset.primary);
      root.style.setProperty('--color-primary-hover', preset.hover);
      root.style.setProperty('--color-primary-light', preset.light);
      root.style.setProperty('--color-primary-subtle', preset.subtle);
      root.style.setProperty('--color-primary-border', preset.border);
      root.style.setProperty('--color-botanical-500', preset.primary);
      root.style.setProperty('--color-botanical-600', preset.hover);
      root.style.setProperty('--color-sidebar-active-bg', preset.primary);
    }

    // 5. Sidebar Colors
    const isDark = resolvedTheme === 'dark';
    let sideConfig = SIDEBAR_COLORS[dataSidebar] || SIDEBAR_COLORS.light;
    if (dataSidebar === 'light' && isDark) {
      sideConfig = {
        bg: '#1E293B',
        text: '#CBD5E1',
        muted: '#64748B',
        border: '#29384E',
        hover: 'rgba(255, 255, 255, 0.08)'
      };
    }

    root.style.setProperty('--color-sidebar-bg', sideConfig.bg);
    root.style.setProperty('--color-sidebar-text', sideConfig.text);
    root.style.setProperty('--color-sidebar-text-muted', sideConfig.muted);
    root.style.setProperty('--color-sidebar-border', sideConfig.border);
    root.style.setProperty('--color-sidebar-hover-bg', sideConfig.hover);
    root.style.setProperty('--color-sidebar-hover-text', sideConfig.text === '#FFFFFF' ? '#FFFFFF' : preset.primary);

    // 6. Topbar Colors
    let topConfig = TOPBAR_COLORS[dataTopBar] || TOPBAR_COLORS.white;
    if (dataTopBar === 'white' && isDark) {
      topConfig = {
        bg: '#1E293B',
        text: '#F8FAFC',
        border: '#29384E'
      };
    }

    root.style.setProperty('--color-header-bg', topConfig.bg);
    root.style.setProperty('--color-header-text', topConfig.text);
    root.style.setProperty('--color-header-border', topConfig.border);
  }, [dataLayout, dataWidth, resolvedTheme, dataTopBar, dataSidebar, dataColor, customColor, isSidebarCollapsed]);

  return (
    <ThemeContext.Provider
      value={{
        dataLayout,
        setDataLayout,
        dataWidth,
        setDataWidth,
        dataTheme,
        setDataTheme,
        theme: resolvedTheme,
        toggleTheme,
        dataTopBar,
        setDataTopBar,
        dataSidebar,
        setDataSidebar,
        dataColor,
        setDataColor,
        customColor,
        setCustomColor,
        isSidebarCollapsed,
        toggleSidebarCollapse,
        setSidebarCollapsed,
        isCustomizerOpen,
        openCustomizer: () => setIsCustomizerOpen(true),
        closeCustomizer: () => setIsCustomizerOpen(false),
        resetAllMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
