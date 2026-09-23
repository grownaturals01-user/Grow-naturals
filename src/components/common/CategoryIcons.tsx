import React from 'react';
import {
  Trees,
  TreePalm,
  TreePine,
  Sprout,
  Wheat,
  Clover,
  Leaf,
  LeafyGreen,
  Flower,
  Flower2,
  Amphora,
  Scissors,
  Wrench,
  Package,
  Boxes,
  FlaskConical,
  LucideProps
} from 'lucide-react';

/**
 * Custom Cactus & Succulents vector icon designed to match Lucide icon design specifications.
 */
export const CactusIcon: React.FC<LucideProps> = ({ size = 18, className, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    {...props}
  >
    {/* Central cactus stem */}
    <path d="M12 3a2 2 0 0 0-2 2v15a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2z" />
    {/* Left arm */}
    <path d="M6 9v3a2 2 0 0 0 2 2h2" />
    {/* Right arm */}
    <path d="M14 11h2a2 2 0 0 0 2-2V7" />
    {/* Base soil ground */}
    <path d="M8 22h8" />
  </svg>
);

/**
 * Custom Pots & Planters vector icon designed to match Lucide icon design specifications.
 */
export const PlanterIcon: React.FC<LucideProps> = ({ size = 18, className, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    {...props}
  >
    {/* Top rim of planter */}
    <path d="M5 9h14" />
    {/* Ceramic pot body */}
    <path d="m6.5 9 1.3 9.4a2 2 0 0 0 2 1.6h4.4a2 2 0 0 0 2-1.6L17.5 9" />
    {/* Growing botanical sprout */}
    <path d="M12 9V5" />
    <path d="M12 6.5a2.5 2.5 0 0 1 3-2.5" />
    <path d="M12 7.5a2.5 2.5 0 0 0-3-2.5" />
  </svg>
);

export interface CategoryThemeMeta {
  color: string;
  bgColor: string;
  borderColor: string;
  name: string;
}

export const CATEGORY_THEMES: Record<string, CategoryThemeMeta> = {
  plants: {
    color: '#15803d', // Green 700
    bgColor: 'rgba(22, 163, 74, 0.1)',
    borderColor: 'rgba(22, 163, 74, 0.25)',
    name: 'Plants & Trees'
  },
  cactus: {
    color: '#0d9488', // Teal 700
    bgColor: 'rgba(13, 148, 136, 0.1)',
    borderColor: 'rgba(13, 148, 136, 0.25)',
    name: 'Cactus & Succulents'
  },
  pots: {
    color: '#c2410c', // Orange / Terracotta 700
    bgColor: 'rgba(234, 88, 12, 0.1)',
    borderColor: 'rgba(234, 88, 12, 0.25)',
    name: 'Pots & Planters'
  },
  fertilizers: {
    color: '#4f46e5', // Indigo 600
    bgColor: 'rgba(79, 70, 229, 0.1)',
    borderColor: 'rgba(79, 70, 229, 0.25)',
    name: 'Fertilizers'
  },
  flowers: {
    color: '#e11d48', // Rose 600
    bgColor: 'rgba(225, 29, 72, 0.1)',
    borderColor: 'rgba(225, 29, 72, 0.25)',
    name: 'Flowers & Decor'
  },
  general: {
    color: '#64748b', // Slate 500
    bgColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: 'rgba(100, 116, 139, 0.25)',
    name: 'General'
  }
};

/**
 * Curated preset icons for Custom Inventory Modules.
 */
export interface ModulePresetIcon {
  id: string;
  label: string;
  group: 'Plants & Botany' | 'Flowers & Seeds' | 'Pots & Decor' | 'Tools & Supplies';
  color: string;
  bgColor: string;
  iconComponent: (size: number) => React.ReactNode;
}

export const MODULE_ICON_PRESETS: ModulePresetIcon[] = [
  {
    id: 'bamboo',
    label: 'Bonsai & Bamboo',
    group: 'Plants & Botany',
    color: '#15803d',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    iconComponent: (s) => <Trees size={s} strokeWidth={2} />
  },
  {
    id: 'palm',
    label: 'Palm & Tropical',
    group: 'Plants & Botany',
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.1)',
    iconComponent: (s) => <TreePalm size={s} strokeWidth={2} />
  },
  {
    id: 'pine',
    label: 'Conifer & Pine',
    group: 'Plants & Botany',
    color: '#047857',
    bgColor: 'rgba(4, 120, 87, 0.1)',
    iconComponent: (s) => <TreePine size={s} strokeWidth={2} />
  },
  {
    id: 'cactus',
    label: 'Succulents & Cacti',
    group: 'Plants & Botany',
    color: '#0f766e',
    bgColor: 'rgba(15, 118, 110, 0.1)',
    iconComponent: (s) => <CactusIcon size={s} />
  },
  {
    id: 'botanicals',
    label: 'Botanical Leaves',
    group: 'Plants & Botany',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    iconComponent: (s) => <Leaf size={s} strokeWidth={2} />
  },
  {
    id: 'foliage',
    label: 'Lush Foliage',
    group: 'Plants & Botany',
    color: '#15803d',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    iconComponent: (s) => <LeafyGreen size={s} strokeWidth={2} />
  },
  {
    id: 'sprout',
    label: 'Saplings & Sprout',
    group: 'Plants & Botany',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    iconComponent: (s) => <Sprout size={s} strokeWidth={2} />
  },
  {
    id: 'seeds',
    label: 'Seeds & Bulbs',
    group: 'Flowers & Seeds',
    color: '#b45309',
    bgColor: 'rgba(180, 83, 9, 0.1)',
    iconComponent: (s) => <Wheat size={s} strokeWidth={2} />
  },
  {
    id: 'herbs',
    label: 'Herbs & Greens',
    group: 'Flowers & Seeds',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    iconComponent: (s) => <Clover size={s} strokeWidth={2} />
  },
  {
    id: 'sunflowers',
    label: 'Sunflowers & Blooms',
    group: 'Flowers & Seeds',
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.1)',
    iconComponent: (s) => <Flower size={s} strokeWidth={2} />
  },
  {
    id: 'orchids',
    label: 'Exotics & Orchids',
    group: 'Flowers & Seeds',
    color: '#e11d48',
    bgColor: 'rgba(225, 29, 72, 0.1)',
    iconComponent: (s) => <Flower2 size={s} strokeWidth={2} />
  },
  {
    id: 'pots',
    label: 'Pots & Planters',
    group: 'Pots & Decor',
    color: '#c2410c',
    bgColor: 'rgba(194, 65, 12, 0.1)',
    iconComponent: (s) => <PlanterIcon size={s} />
  },
  {
    id: 'vases',
    label: 'Clay & Vases',
    group: 'Pots & Decor',
    color: '#b45309',
    bgColor: 'rgba(180, 83, 9, 0.1)',
    iconComponent: (s) => <Amphora size={s} strokeWidth={2} />
  },
  {
    id: 'shears',
    label: 'Tools & Shears',
    group: 'Tools & Supplies',
    color: '#475569',
    bgColor: 'rgba(71, 85, 105, 0.1)',
    iconComponent: (s) => <Scissors size={s} strokeWidth={2} />
  },
  {
    id: 'hardware',
    label: 'Supplies & Hardware',
    group: 'Tools & Supplies',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.1)',
    iconComponent: (s) => <Wrench size={s} strokeWidth={2} />
  },
  {
    id: 'drygoods',
    label: 'Dry Goods & Storage',
    group: 'Tools & Supplies',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.1)',
    iconComponent: (s) => <Package size={s} strokeWidth={2} />
  },
];

/**
 * Universal renderer that translates icon keys, legacy emojis, and custom inputs
 * into crisp modern vector icons across the entire application.
 */
export const renderModuleIcon = (
  iconKeyOrEmoji: string | undefined,
  size: number = 18,
  style?: React.CSSProperties
): React.ReactNode => {
  if (!iconKeyOrEmoji) return <Boxes size={size} style={style} />;

  const key = iconKeyOrEmoji.toLowerCase().trim();

  switch (key) {
    case 'bamboo':
    case 'bonsai':
    case '🎋':
      return <Trees size={size} strokeWidth={2} style={style} />;
    case 'palm':
    case 'tropical':
    case '🌴':
      return <TreePalm size={size} strokeWidth={2} style={style} />;
    case 'pine':
    case 'conifer':
    case '🌲':
      return <TreePine size={size} strokeWidth={2} style={style} />;
    case 'cactus':
    case 'succulents':
    case '🌵':
      return <CactusIcon size={size} style={style} />;
    case 'botanicals':
    case 'leaf':
    case '🌿':
      return <Leaf size={size} strokeWidth={2} style={style} />;
    case 'foliage':
    case '🍃':
      return <LeafyGreen size={size} strokeWidth={2} style={style} />;
    case 'sprout':
    case 'sapling':
    case '🌱':
      return <Sprout size={size} strokeWidth={2} style={style} />;
    case 'seeds':
    case 'bulbs':
    case 'wheat':
    case '🌾':
      return <Wheat size={size} strokeWidth={2} style={style} />;
    case 'herbs':
    case 'greens':
    case 'clover':
    case '🍀':
      return <Clover size={size} strokeWidth={2} style={style} />;
    case 'sunflowers':
    case 'sunflower':
    case 'blooms':
    case '🌻':
      return <Flower size={size} strokeWidth={2} style={style} />;
    case 'orchids':
    case 'orchid':
    case 'exotics':
    case 'flowers':
    case 'flower':
    case '🌺':
    case '🌸':
    case '💐':
      return <Flower2 size={size} strokeWidth={2} style={style} />;
    case 'pots':
    case 'trays':
    case 'planter':
    case '🪴':
      return <PlanterIcon size={size} style={style} />;
    case 'vases':
    case 'clay':
    case 'vase':
    case 'amphora':
    case '🏺':
      return <Amphora size={size} strokeWidth={2} style={style} />;
    case 'shears':
    case 'tools':
    case 'scissors':
    case '🪓':
      return <Scissors size={size} strokeWidth={2} style={style} />;
    case 'hardware':
    case 'supplies':
    case 'wrench':
    case '🛠️':
    case '🛠':
      return <Wrench size={size} strokeWidth={2} style={style} />;
    case 'drygoods':
    case 'dry goods':
    case 'packages':
    case 'package':
    case 'boxes':
    case 'box':
    case '🍂':
    case '📦':
      return <Package size={size} strokeWidth={2} style={style} />;
    case 'fertilizers':
    case 'fertilizer':
    case '🧪':
      return <FlaskConical size={size} strokeWidth={2} style={style} />;
    default:
      // If it's a short emoji or text (e.g. 🍄, 🍁)
      if (iconKeyOrEmoji.length <= 4) {
        return <span style={{ fontSize: `${size}px`, lineHeight: 1, ...style }}>{iconKeyOrEmoji}</span>;
      }
      return <Boxes size={size} strokeWidth={2} style={style} />;
  }
};

/**
 * Returns a professional vector icon component for a category slug or type.
 */
export const getCategoryIcon = (categoryType: string, size: number = 18): React.ReactNode => {
  return renderModuleIcon(categoryType, size);
};

/**
 * Styled category icon badge with domain color-coordinated background.
 */
export const CategoryIconBadge: React.FC<{
  type: string;
  size?: number;
  badgeSize?: number;
  isSelected?: boolean;
  customIcon?: string | React.ReactNode;
}> = ({ type, size = 18, badgeSize = 36, isSelected = false, customIcon }) => {
  const normalizedType = type.toLowerCase();
  const theme = CATEGORY_THEMES[normalizedType] || CATEGORY_THEMES.general;

  const renderIcon = () => {
    if (['plants', 'cactus', 'pots', 'fertilizers', 'flowers', 'general'].includes(normalizedType)) {
      return getCategoryIcon(normalizedType, size);
    }
    if (customIcon) {
      if (typeof customIcon === 'string') {
        return renderModuleIcon(customIcon, size);
      }
      return customIcon;
    }
    return getCategoryIcon(normalizedType, size);
  };

  return (
    <div
      className={`category-badge-box category-badge-${normalizedType}`}
      style={{
        width: `${badgeSize}px`,
        height: `${badgeSize}px`,
        minWidth: `${badgeSize}px`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.color,
        backgroundColor: theme.bgColor,
        border: `1px solid ${theme.borderColor}`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'scale(1.05)' : 'none',
        boxShadow: isSelected ? `0 2px 6px ${theme.bgColor}` : 'none'
      }}
    >
      {renderIcon()}
    </div>
  );
};

