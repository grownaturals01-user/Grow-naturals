import React, { useState } from 'react';
import {
  useTheme,
  THEME_COLOR_PRESETS,
  LayoutMode,
  LayoutWidth,
  ThemeMode,
} from '../../context/ThemeContext';
import {
  X,
  RotateCcw,
  Sun,
  Moon,
  Laptop,
  ChevronUp,
  ChevronDown,
  Check,
  ShoppingCart,
  Palette,
  Layers,
  Columns
} from 'lucide-react';

// Layout SVGs
import {
  defaultIcon as defaultSvg,
  mini as miniSvg,
  twoColumn as twoColumnSvg,
  horizontal as horizontalSvg,
  detached as detachedSvg,
  withoutHeader as withoutHeaderSvg,
  rtl as rtlSvg,
} from '../../utils/imagepath';

export const ThemeCustomizerDrawer: React.FC = () => {
  const {
    dataLayout,
    setDataLayout,
    dataWidth,
    setDataWidth,
    dataTheme,
    setDataTheme,
    dataTopBar,
    setDataTopBar,
    dataSidebar,
    setDataSidebar,
    dataColor,
    setDataColor,
    customColor,
    setCustomColor,
    isCustomizerOpen,
    openCustomizer,
    closeCustomizer,
    resetAllMode,
  } = useTheme();

  // Accordion open/collapse states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    layout: true,
    width: true,
    topbar: false,
    sidebar: false,
    mode: false,
    colors: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const buyProduct = () => {
    window.open(
      "https://themeforest.net/item/dreamspos-pos-inventory-management-admin-dashboard-template/38834413",
      "_blank"
    );
  };

  const layoutOptions: Array<{ id: LayoutMode; name: string; img: string }> = [
    { id: 'default', name: 'Default', img: defaultSvg },
    { id: 'mini', name: 'Mini', img: miniSvg },
    { id: 'twocolumn', name: 'Two Column', img: twoColumnSvg },
    { id: 'horizontal', name: 'Horizontal', img: horizontalSvg },
    { id: 'detached', name: 'Detached', img: detachedSvg },
    { id: 'without-header', name: 'Without Header', img: withoutHeaderSvg },
    { id: 'rtl', name: 'RTL', img: rtlSvg },
  ];

  // 7 Solid Topbar Colors
  const solidTopbarColors = [
    { id: 'white', label: 'White', color: '#FFFFFF' },
    { id: 'topbarcolorone', label: 'Dark Aqua', color: '#116D6E' },
    { id: 'topbarcolortwo', label: 'White Rock', color: '#F0E4D7' },
    { id: 'topbarcolorthree', label: 'Rock Blue', color: '#8CB9BD' },
    { id: 'topbarcolorfour', label: 'Blue Haze', color: '#B5C0D0' },
    { id: 'topbarcolorfive', label: 'Purple Gem', color: '#6C0BA9' },
    { id: 'topbarcolorsix', label: 'Teal Forest', color: '#0B897D' },
  ];

  // 8 Gradient Topbar Colors
  const gradientTopbarColors = [
    { id: 'topbarcolorseven', label: 'Gradient 1', gradient: 'linear-gradient(180deg, #4B749F 0%, #243748 100%)' },
    { id: 'topbarcoloreight', label: 'Gradient 2', gradient: 'linear-gradient(180deg, #18ACCF 0%, #0F59AD 100%)' },
    { id: 'topbarcolornine', label: 'Gradient 3', gradient: 'linear-gradient(180deg, #7D90B8 0%, #103783 100%)' },
    { id: 'topbarcolorten', label: 'Gradient 4', gradient: 'linear-gradient(180deg, #8E4BEB 0%, #472282 100%)' },
    { id: 'topbarcoloreleven', label: 'Gradient 5', gradient: 'linear-gradient(180deg, #309F92 0%, #0C5666 100%)' },
    { id: 'topbarcolortwelve', label: 'Gradient 6', gradient: 'linear-gradient(90deg, #FF9966 1.92%, #FF5E62 100%)' },
    { id: 'topbarcolorthirteen', label: 'Gradient 7', gradient: 'linear-gradient(90deg, #760762 1.92%, #883907 100%)' },
    { id: 'topbarcolorfourteen', label: 'Gradient 8', gradient: 'linear-gradient(90deg, #4471CC 1.92%, #AE7BD4 100%)' },
  ];

  // 7 Solid Sidebar Colors
  const solidSidebarColors = [
    { id: 'light', label: 'Light', color: '#FFFFFF' },
    { id: 'sidebarcolorone', label: 'Sidebar 1', color: '#FBFBFB' },
    { id: 'sidebarcolortwo', label: 'Sidebar 2', color: '#505969' },
    { id: 'sidebarcolorthree', label: 'Sidebar 3', color: '#2C2C2C' },
    { id: 'sidebarcolorfour', label: 'Sidebar 4', color: '#1D51B6' },
    { id: 'sidebarcolorfive', label: 'Sidebar 5', color: '#6C0BA9' },
    { id: 'sidebarcolorsix', label: 'Sidebar 6', color: '#0B897D' },
  ];

  // 8 Gradient Sidebar Colors
  const gradientSidebarColors = [
    { id: 'sidebarcolorseven', label: 'Sidebar Gradient 1', gradient: 'linear-gradient(180deg, #4B749F 0%, #243748 100%)' },
    { id: 'sidebarcoloreight', label: 'Sidebar Gradient 2', gradient: 'linear-gradient(180deg, #18ACCF 0%, #0F59AD 100%)' },
    { id: 'sidebarcolornine', label: 'Sidebar Gradient 3', gradient: 'linear-gradient(180deg, #7D90B8 0%, #103783 100%)' },
    { id: 'sidebarcolorten', label: 'Sidebar Gradient 4', gradient: 'linear-gradient(180deg, #8E4BEB 0%, #472282 100%)' },
    { id: 'sidebarcoloreleven', label: 'Sidebar Gradient 5', gradient: 'linear-gradient(180deg, #309F92 0%, #0C5666 100%)' },
    { id: 'sidebarcolortwelve', label: 'Sidebar Gradient 6', gradient: 'linear-gradient(90deg, #FF9966 1.92%, #FF5E62 100%)' },
    { id: 'sidebarcolorthirteen', label: 'Sidebar Gradient 7', gradient: 'linear-gradient(90deg, #760762 1.92%, #883907 100%)' },
    { id: 'sidebarcolorfourteen', label: 'Sidebar Gradient 8', gradient: 'linear-gradient(90deg, #4471CC 1.92%, #AE7BD4 100%)' },
  ];

  // Theme color swatches
  const themeColorsList = [
    { id: 'primary', label: 'Primary Orange', color: '#FE9F43' },
    { id: 'brightblue', label: 'Bright Blue', color: '#009688' },
    { id: 'lunargreen', label: 'Lunar Red', color: '#D63031' },
    { id: 'lavendar', label: 'Lavender Purple', color: '#6C5CE7' },
    { id: 'magenta', label: 'Magenta Blue', color: '#0984E3' },
    { id: 'chromeyellow', label: 'Chrome Yellow', color: '#00B894' },
    { id: 'orange', label: 'Deep Orange', color: '#E04F16' },
  ];

  return (
    <>
      {/* Floating Gear Button (DreamsPOS Style) */}
      <div className="sidebar-contact">
        <div
          className="toggle-theme"
          onClick={openCustomizer}
          title="Theme Customizer"
        >
          <i className="fa fa-cog fa-spin-gear">⚙</i>
        </div>
      </div>

      {/* Backdrop */}
      {isCustomizerOpen && (
        <div className="theme-customizer-backdrop" onClick={closeCustomizer} />
      )}

      {/* Slide-out Drawer */}
      <div className={`sidebar-themesettings offcanvas offcanvas-end ${isCustomizerOpen ? 'open' : ''}`}>
        {/* Offcanvas Header */}
        <div className="offcanvas-header d-flex align-items-center justify-content-between bg-dark">
          <div>
            <h3 className="mb-1 text-white">Theme Customizer</h3>
            <p className="text-light">Choose your themes &amp; layouts etc.</p>
          </div>
          <button
            type="button"
            className="custom-btn-close d-flex align-items-center justify-content-center text-white"
            onClick={closeCustomizer}
            title="Close Customizer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Offcanvas Body */}
        <div className="themecard-body offcanvas-body">
          <div className="accordion accordion-customicon1 accordions-items-seperate" id="settingtheme">
            
            {/* 1. SELECT LAYOUTS */}
            <div className="accordion-item border px-3 layout-select">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark bg-transparent fs-16 px-0 py-3 d-flex align-items-center justify-content-between w-100"
                  type="button"
                  onClick={() => toggleSection('layout')}
                >
                  <span>Select Layouts</span>
                  {openSections.layout ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </h2>
              {openSections.layout && (
                <div className="accordion-collapse collapse show">
                  <div className="accordion-body border-top px-0 py-3">
                    <div className="row gx-3">
                      {layoutOptions.map((layout) => {
                        const isSelected = dataLayout === layout.id;
                        return (
                          <div key={layout.id} className="col-4">
                            <div className="theme-layout mb-3">
                              <input
                                type="radio"
                                name="LayoutTheme"
                                id={`layout_${layout.id}`}
                                value={layout.id}
                                checked={isSelected}
                                onChange={() => setDataLayout(layout.id)}
                              />
                              <label htmlFor={`layout_${layout.id}`} onClick={() => setDataLayout(layout.id)}>
                                <span className="d-block mb-2 layout-img">
                                  <img src={layout.img} alt={layout.name} />
                                </span>
                                <span className="layout-type">{layout.name}</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. LAYOUT WIDTH */}
            <div className="accordion-item border px-3 layout-select">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 bg-transparent px-0 py-3 d-flex align-items-center justify-content-between w-100"
                  type="button"
                  onClick={() => toggleSection('width')}
                >
                  <span>Layout Width</span>
                  {openSections.width ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </h2>
              {openSections.width && (
                <div className="accordion-collapse collapse show">
                  <div className="accordion-body px-0 py-3 border-top">
                    <div className="d-flex align-items-center layout-width-wrap">
                      <div className="theme-width m-1 me-2 flex-fill">
                        <input
                          type="radio"
                          name="width"
                          id="fluidWidth"
                          value="fluid"
                          checked={dataWidth === 'fluid'}
                          onChange={() => setDataWidth('fluid')}
                        />
                        <label htmlFor="fluidWidth" className="d-block rounded fs-12 text-center" onClick={() => setDataWidth('fluid')}>
                          <span className="layout-width-icon">☲</span> Fluid Layout
                        </label>
                      </div>
                      <div className="theme-width m-1 flex-fill">
                        <input
                          type="radio"
                          name="width"
                          id="boxWidth"
                          value="box"
                          checked={dataWidth === 'box'}
                          onChange={() => setDataWidth('box')}
                        />
                        <label htmlFor="boxWidth" className="d-block rounded fs-12 text-center" onClick={() => setDataWidth('box')}>
                          <span className="layout-width-icon">☵</span> Boxed Layout
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. TOP BAR COLOR */}
            <div className="accordion-item border px-3 themesettings-topbar-color">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 px-0 py-3 bg-transparent d-flex align-items-center justify-content-between w-100"
                  type="button"
                  onClick={() => toggleSection('topbar')}
                >
                  <span>Top Bar Color</span>
                  {openSections.topbar ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </h2>
              {openSections.topbar && (
                <div className="accordion-collapse collapse show">
                  <div className="accordion-body pb-1 px-0 py-3 border-top">
                    <p className="mb-2 text-gray-9 font-weight-500 fs-13">Solid Colors</p>
                    <div className="d-flex align-items-center flex-wrap mb-3">
                      {solidTopbarColors.map((t) => (
                        <div key={t.id} className="custom-themecolor custom-themecolor-rounded mb-3 me-3">
                          <input
                            type="radio"
                            name="topbar"
                            id={`topbar_${t.id}`}
                            value={t.id}
                            checked={dataTopBar === t.id}
                            onChange={() => setDataTopBar(t.id)}
                          />
                          <label
                            htmlFor={`topbar_${t.id}`}
                            style={{ backgroundColor: t.color, border: t.id === 'white' ? '1px solid #CBD5E1' : 'none' }}
                            onClick={() => setDataTopBar(t.id)}
                            title={t.label}
                          />
                        </div>
                      ))}
                    </div>

                    <p className="mb-2 text-gray-9 font-weight-500 fs-13">Gradient Colors</p>
                    <div className="d-flex align-items-center flex-wrap">
                      {gradientTopbarColors.map((t) => (
                        <div key={t.id} className="custom-themecolor custom-themecolor-rounded mb-3 me-3">
                          <input
                            type="radio"
                            name="topbar"
                            id={`topbar_${t.id}`}
                            value={t.id}
                            checked={dataTopBar === t.id}
                            onChange={() => setDataTopBar(t.id)}
                          />
                          <label
                            htmlFor={`topbar_${t.id}`}
                            style={{ background: t.gradient }}
                            onClick={() => setDataTopBar(t.id)}
                            title={t.label}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. SIDEBAR COLOR */}
            <div className="accordion-item border px-3 themesidebar-color">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 px-0 py-3 bg-transparent d-flex align-items-center justify-content-between w-100"
                  type="button"
                  onClick={() => toggleSection('sidebar')}
                >
                  <span>Sidebar Color</span>
                  {openSections.sidebar ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </h2>
              {openSections.sidebar && (
                <div className="accordion-collapse collapse show">
                  <div className="accordion-body px-0 py-3 border-top">
                    <p className="mb-2 text-gray-9 font-weight-500 fs-13">Solid Colors</p>
                    <div className="d-flex align-items-center flex-wrap mb-3">
                      {solidSidebarColors.map((s) => (
                        <div key={s.id} className="custom-themecolor me-3 mb-3">
                          <input
                            type="radio"
                            name="sidebar"
                            id={`sidebar_${s.id}`}
                            value={s.id}
                            checked={dataSidebar === s.id}
                            onChange={() => setDataSidebar(s.id)}
                          />
                          <label
                            htmlFor={`sidebar_${s.id}`}
                            style={{ backgroundColor: s.color, border: s.id === 'light' ? '1px solid #CBD5E1' : 'none' }}
                            onClick={() => setDataSidebar(s.id)}
                            title={s.label}
                          />
                        </div>
                      ))}
                    </div>

                    <p className="mb-2 text-gray-9 font-weight-500 fs-13">Gradient Colors</p>
                    <div className="d-flex align-items-center flex-wrap">
                      {gradientSidebarColors.map((s) => (
                        <div key={s.id} className="custom-themecolor me-3 mb-3">
                          <input
                            type="radio"
                            name="sidebar"
                            id={`sidebar_${s.id}`}
                            value={s.id}
                            checked={dataSidebar === s.id}
                            onChange={() => setDataSidebar(s.id)}
                          />
                          <label
                            htmlFor={`sidebar_${s.id}`}
                            style={{ background: s.gradient }}
                            onClick={() => setDataSidebar(s.id)}
                            title={s.label}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. THEME MODE */}
            <div className="accordion-item border px-3">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 px-0 py-3 bg-transparent d-flex align-items-center justify-content-between w-100"
                  type="button"
                  onClick={() => toggleSection('mode')}
                >
                  <span>Theme Mode</span>
                  {openSections.mode ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </h2>
              {openSections.mode && (
                <div className="accordion-collapse collapse show">
                  <div className="accordion-body px-0 py-3 border-top">
                    <div className="d-flex align-items-center">
                      <div className="theme-mode flex-fill text-center w-100 me-2">
                        <input
                          type="radio"
                          name="theme"
                          id="lightTheme"
                          value="light"
                          checked={dataTheme === 'light'}
                          onChange={() => setDataTheme('light')}
                        />
                        <label htmlFor="lightTheme" className="rounded fw-medium w-100 d-flex align-items-center justify-content-center" onClick={() => setDataTheme('light')}>
                          <span className="d-inline-flex rounded me-2">
                            <Sun size={15} color="#FE9F43" />
                          </span>
                          Light
                        </label>
                      </div>
                      <div className="theme-mode flex-fill text-center w-100 me-2">
                        <input
                          type="radio"
                          name="theme"
                          id="darkTheme"
                          value="dark"
                          checked={dataTheme === 'dark'}
                          onChange={() => setDataTheme('dark')}
                        />
                        <label htmlFor="darkTheme" className="rounded fw-medium w-100 d-flex align-items-center justify-content-center" onClick={() => setDataTheme('dark')}>
                          <span className="d-inline-flex rounded me-2">
                            <Moon size={15} color="#6938EF" />
                          </span>
                          Dark
                        </label>
                      </div>
                      <div className="theme-mode flex-fill text-center w-100">
                        <input
                          type="radio"
                          name="theme"
                          id="systemTheme"
                          value="system"
                          checked={dataTheme === 'system'}
                          onChange={() => setDataTheme('system')}
                        />
                        <label htmlFor="systemTheme" className="rounded fw-medium w-100 d-flex align-items-center justify-content-center" onClick={() => setDataTheme('system')}>
                          <span className="d-inline-flex rounded me-2">
                            <Laptop size={15} color="#0E9384" />
                          </span>
                          System
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. THEME COLORS */}
            <div className="accordion-item border px-3">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 px-0 py-3 bg-transparent d-flex align-items-center justify-content-between w-100"
                  type="button"
                  onClick={() => toggleSection('colors')}
                >
                  <span>Theme Colors</span>
                  {openSections.colors ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </h2>
              {openSections.colors && (
                <div className="accordion-collapse collapse show">
                  <div className="accordion-body pb-2 px-0 py-3 border-top">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      {themeColorsList.map((c) => (
                        <div key={c.id} className="theme-colorsset me-2 mb-2">
                          <input
                            type="radio"
                            name="color"
                            id={`color_${c.id}`}
                            value={c.id}
                            checked={dataColor === c.id}
                            onChange={() => setDataColor(c.id)}
                          />
                          <label
                            htmlFor={`color_${c.id}`}
                            style={{ backgroundColor: c.color }}
                            onClick={() => setDataColor(c.id)}
                            title={c.label}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions matching screenshot */}
        <div className="p-3 pt-0 border-top-0 customizer-footer-action-wrap">
          <div className="row gx-3 d-flex">
            <div className="col-6">
              <button
                type="button"
                id="resetbutton"
                className="btn btn-light close-theme w-100 d-flex align-items-center justify-content-center"
                onClick={resetAllMode}
              >
                <RotateCcw size={15} className="me-2" />
                Reset
              </button>
            </div>
            <div className="col-6">
              <button
                type="button"
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                onClick={buyProduct}
              >
                <ShoppingCart size={15} className="me-2" />
                Buy Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

