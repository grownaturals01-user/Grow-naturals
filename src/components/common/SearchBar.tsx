import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search items, customers, codes...',
  className = '',
}) => {
  return (
    <div className={`search-container ${className}`}>
      <div className="search-icon-wrapper">
        <Search size={16} />
      </div>
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
