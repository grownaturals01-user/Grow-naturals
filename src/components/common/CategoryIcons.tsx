import React from 'react';
import {
  TreePalm,
  TreePine,
  TreeDeciduous,
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
  Droplets,
  Shovel,
  Sparkles,
  LucideProps
} from 'lucide-react';

/**
 * Professional Bonsai & Japanese Miniature Tree Vector Icon
 */
export const BonsaiIcon: React.FC<LucideProps> = ({ size = 20, className, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    {...props}
  >
    {/* Shallow Bonsai Tray / Pot */}
    <path d="M4 19h16" />
    <path d="M5.5 19l1 3h11l1-3" />
    {/* Curving Ancient Trunk */}
    <path d="M12 19v-4.5c0-1.5 1.8-2.5 1.8-4.2 0-1.2-.8-2.3-1.8-3.3" />
    <path d="M10 14.5c-2-1-2.5-2.2-2.5-3.5" />
    {/* Tiered Foliage Clouds */}
    <path d="M10 6.5a2.8 2.8 0 0 1 5.2-1.2 2.6 2.6 0 0 1 2.8 2.7c0 1.3-.9 2.4-2.2 2.6h-5a2.5 2.5 0 0 1-.8-4.1z" />
    <path d="M6 11a2.2 2.2 0 0 1 3.8-1.5 2.2 2.2 0 0 1 1.2 2c0 1-.7 1.8-1.6 2H6.5a2 2 0 0 1-.5-2.5z" />
    <path d="M14 11.5a2 2 0 0 1 3.5-.8 2 2 0 0 1 .5 1.6c0 .9-.6 1.7-1.5 1.7h-2.5z" />
  </svg>
);

/**
 * Professional Saguaro & Desert Succulent Vector Icon
 */
export const CactusIcon: React.FC<LucideProps> = ({ size = 20, className, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    {...props}
  >
    {/* Main central column */}
    <rect x="9.5" y="3" width="5" height="17" rx="2.5" />
    {/* Left Arm */}
    <path d="M5.5 8v4a3 3 0 0 0 3 3h1" />
    <path d="M5.5 8a1.5 1.5 0 0 1 3 0" />
    {/* Right Arm */}
    <path d="M18.5 6.5v4.5a3 3 0 0 1-3 3h-1" />
    <path d="M18.5 6.5a1.5 1.5 0 0 0-3 0" />
    {/* Ground Soil / Base */}
    <path d="M6 20h12" />
    {/* Subtle rib needles */}
    <line x1="12" y1="7" x2="12" y2="16" strokeDasharray="1 2.5" />
  </svg>
);

/**
 * Professional Terracotta Planter & Houseplant Vector Icon
 */
export const PlanterIcon: React.FC<LucideProps> = ({ size = 20, className, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    {...props}
  >
    {/* Indoor plant leaves */}
    <path d="M12 11V3.5" />
    <path d="M12 7c-2.8-3.2-6.5-2.2-6.5 1.2 0 2.2 2.8 2.8 6.5 2.8" />
    <path d="M12 5.5c2.8-3.2 6.5-2.2 6.5 1.2 0 2.2-2.8 2.8-6.5 2.8" />
    {/* Planter Pot Rim */}
    <rect x="4" y="11" width="16" height="3" rx="1.5" />
    {/* Ceramic Pot Body */}
    <path d="M5.8 14l1.4 6.2a2 2 0 0 0 1.9 1.8h5.8a2 2 0 0 0 1.9-1.8L18.2 14" />
    {/* Pot Base Stand */}
    <path d="M8 22h8" />
  </svg>
);

/**
 * Professional Monstera Deliciosa Leaf Vector Icon
 */
export const MonsteraIcon: React.FC<LucideProps> = ({ size = 20, className, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    {...props}
  >
    <path d="M12 21V3" />
    {/* Monstera leaf lobe outline with characteristic slits */}
    <path d="M12 3C6.5 3 4 8 4 14c0 4.5 3.5 7 8 7 4.5 0 8-2.5 8-7 0-6-2.5-11-8-11z" />
    <path d="M12 8c2.5-.5 4.5.5 5.5 2" />
    <path d="M12 12c3-.5 5 1 5.5 3" />
    <path d="M12 16c2.5 0 4 1 4.5 2.5" />
    <path d="M12 8c-2.5-.5-4.5.5-5.5 2" />
    <path d="M12 12c-3-.5-5 1-5.5 3" />
    <path d="M12 16c-2.5 0-4 1-4.5 2.5" />
  </svg>
);

/**
 * Professional Gardening Pruning Shears Vector Icon
 */
export const PrunerIcon: React.FC<LucideProps> = ({ size = 20, className, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    {...props}
  >
    <circle cx="12" cy="11" r="2" />
    {/* Curved cutting blades */}
    <path d="M13.5 9.5L19 4a2 2 0 0 0-2.8-2.8l-5.7 5.7" />
    <path d="M10.5 9.5L5 4a2 2 0 0 1 2.8-2.8l5.7 5.7" />
    {/* Ergonomic cushioned handles */}
    <path d="M10.5 12.5L6 19a2.5 2.5 0 0 0 3.5 3.5l4-5.5" />
    <path d="M13.5 12.5L18 19a2.5 2.5 0 0 1-3.5 3.5l-4-5.5" />
  </svg>
);

/**
 * Professional Botanical Watering Can Vector Icon
 */
export const WateringCanIcon: React.FC<LucideProps> = ({ size = 20, className, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    {...props}
  >
    {/* Can body */}
    <path d="M4 10h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z" />
    {/* Top handle */}
    <path d="M7 10V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v4" />
    {/* Side grip handle */}
    <path d="M4 12H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2" />
    {/* Long spout */}
    <path d="M17 14l5-5v-1" />
    {/* Rose sprinkler head */}
    <path d="M21 7l2 2" />
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
    name: 'Fertilizers & Care'
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
    bgColor: 'rgba(22, 163, 74, 0.12)',
    iconComponent: (s) => <BonsaiIcon size={s} />
  },
  {
    id: 'palm',
    label: 'Palm & Tropical',
    group: 'Plants & Botany',
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.12)',
    iconComponent: (s) => <TreePalm size={s} strokeWidth={1.85} />
  },
  {
    id: 'pine',
    label: 'Conifer & Pine',
    group: 'Plants & Botany',
    color: '#047857',
    bgColor: 'rgba(4, 120, 87, 0.12)',
    iconComponent: (s) => <TreePine size={s} strokeWidth={1.85} />
  },
  {
    id: 'cactus',
    label: 'Succulents & Cacti',
    group: 'Plants & Botany',
    color: '#0f766e',
    bgColor: 'rgba(15, 118, 110, 0.12)',
    iconComponent: (s) => <CactusIcon size={s} />
  },
  {
    id: 'botanicals',
    label: 'Botanical Leaves',
    group: 'Plants & Botany',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.12)',
    iconComponent: (s) => <MonsteraIcon size={s} />
  },
  {
    id: 'foliage',
    label: 'Lush Foliage',
    group: 'Plants & Botany',
    color: '#15803d',
    bgColor: 'rgba(21, 128, 61, 0.12)',
    iconComponent: (s) => <LeafyGreen size={s} strokeWidth={1.85} />
  },
  {
    id: 'sprout',
    label: 'Saplings & Sprout',
    group: 'Plants & Botany',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.12)',
    iconComponent: (s) => <Sprout size={s} strokeWidth={1.85} />
  },
  {
    id: 'seeds',
    label: 'Seeds & Bulbs',
    group: 'Flowers & Seeds',
    color: '#b45309',
    bgColor: 'rgba(180, 83, 9, 0.12)',
    iconComponent: (s) => <Wheat size={s} strokeWidth={1.85} />
  },
  {
    id: 'herbs',
    label: 'Herbs & Greens',
    group: 'Flowers & Seeds',
    color: '#15803d',
    bgColor: 'rgba(22, 163, 74, 0.12)',
    iconComponent: (s) => <Clover size={s} strokeWidth={1.85} />
  },
  {
    id: 'sunflowers',
    label: 'Sunflowers & Blooms',
    group: 'Flowers & Seeds',
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.12)',
    iconComponent: (s) => <Flower size={s} strokeWidth={1.85} />
  },
  {
    id: 'orchids',
    label: 'Exotics & Orchids',
    group: 'Flowers & Seeds',
    color: '#e11d48',
    bgColor: 'rgba(225, 29, 72, 0.12)',
    iconComponent: (s) => <Flower2 size={s} strokeWidth={1.85} />
  },
  {
    id: 'pots',
    label: 'Pots & Planters',
    group: 'Pots & Decor',
    color: '#c2410c',
    bgColor: 'rgba(194, 65, 12, 0.12)',
    iconComponent: (s) => <PlanterIcon size={s} />
  },
  {
    id: 'vases',
    label: 'Clay & Vases',
    group: 'Pots & Decor',
    color: '#b45309',
    bgColor: 'rgba(180, 83, 9, 0.12)',
    iconComponent: (s) => <Amphora size={s} strokeWidth={1.85} />
  },
  {
    id: 'shears',
    label: 'Tools & Shears',
    group: 'Tools & Supplies',
    color: '#334155',
    bgColor: 'rgba(51, 65, 85, 0.12)',
    iconComponent: (s) => <PrunerIcon size={s} />
  },
  {
    id: 'hardware',
    label: 'Supplies & Hardware',
    group: 'Tools & Supplies',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.12)',
    iconComponent: (s) => <Wrench size={s} strokeWidth={1.85} />
  },
  {
    id: 'watering',
    label: 'Watering & Care',
    group: 'Tools & Supplies',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.12)',
    iconComponent: (s) => <WateringCanIcon size={s} />
  },
  {
    id: 'drygoods',
    label: 'Dry Goods & Storage',
    group: 'Tools & Supplies',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.12)',
    iconComponent: (s) => <Package size={s} strokeWidth={1.85} />
  },
  {
    id: 'fertilizers',
    label: 'Nutrients & Care',
    group: 'Tools & Supplies',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.12)',
    iconComponent: (s) => <FlaskConical size={s} strokeWidth={1.85} />
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
      return <BonsaiIcon size={size} style={style} />;
    case 'palm':
    case 'tropical':
    case '🌴':
      return <TreePalm size={size} strokeWidth={1.85} style={style} />;
    case 'pine':
    case 'conifer':
    case '🌲':
      return <TreePine size={size} strokeWidth={1.85} style={style} />;
    case 'cactus':
    case 'succulents':
    case '🌵':
      return <CactusIcon size={size} style={style} />;
    case 'botanicals':
    case 'monstera':
    case 'leaf':
    case '🌿':
      return <MonsteraIcon size={size} style={style} />;
    case 'foliage':
    case '🍃':
      return <LeafyGreen size={size} strokeWidth={1.85} style={style} />;
    case 'sprout':
    case 'sapling':
    case '🌱':
      return <Sprout size={size} strokeWidth={1.85} style={style} />;
    case 'seeds':
    case 'bulbs':
    case 'wheat':
    case '🌾':
      return <Wheat size={size} strokeWidth={1.85} style={style} />;
    case 'herbs':
    case 'greens':
    case 'clover':
    case '🍀':
      return <Clover size={size} strokeWidth={1.85} style={style} />;
    case 'sunflowers':
    case 'sunflower':
    case 'blooms':
    case '🌻':
      return <Flower size={size} strokeWidth={1.85} style={style} />;
    case 'orchids':
    case 'orchid':
    case 'exotics':
    case 'flowers':
    case 'flower':
    case '🌺':
    case '🌸':
    case '💐':
      return <Flower2 size={size} strokeWidth={1.85} style={style} />;
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
      return <Amphora size={size} strokeWidth={1.85} style={style} />;
    case 'shears':
    case 'tools':
    case 'scissors':
    case '🪓':
      return <PrunerIcon size={size} style={style} />;
    case 'hardware':
    case 'supplies':
    case 'wrench':
    case '🛠️':
    case '🛠':
      return <Wrench size={size} strokeWidth={1.85} style={style} />;
    case 'watering':
    case 'irrigation':
    case 'can':
    case '🚿':
      return <WateringCanIcon size={size} style={style} />;
    case 'drygoods':
    case 'dry goods':
    case 'packages':
    case 'package':
    case 'boxes':
    case 'box':
    case '🍂':
    case '📦':
      return <Package size={size} strokeWidth={1.85} style={style} />;
    case 'fertilizers':
    case 'fertilizer':
    case '🧪':
      return <FlaskConical size={size} strokeWidth={1.85} style={style} />;
    default:
      // If it's a short emoji or text (e.g. 🍄, 🍁)
      if (iconKeyOrEmoji.length <= 4) {
        return <span style={{ fontSize: `${size}px`, lineHeight: 1, ...style }}>{iconKeyOrEmoji}</span>;
      }
      return <Boxes size={size} strokeWidth={1.85} style={style} />;
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

