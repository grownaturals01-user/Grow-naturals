import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  variant?: 'stat-sell' | 'stat-inv' | 'stat-proj' | 'stat-purch' | 'stat-ops';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  variant = 'stat-sell',
}) => {
  return (
    <div className={`stat-card ${variant}`}>
      <span className="stat-card-accent-bar" />
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value tabular">{value}</span>
        {subValue && <span className="stat-sub">{subValue}</span>}
      </div>
      <div className="stat-icon-wrapper">
        <Icon size={22} />
      </div>
    </div>
  );
};
