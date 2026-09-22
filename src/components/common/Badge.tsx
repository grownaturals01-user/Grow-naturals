import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'sell'
  | 'inv'
  | 'proj'
  | 'purch'
  | 'secondary'
  | 'primary'
  | 'ops'
  | 'admin';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  style,
  title,
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style} title={title}>
      {children}
    </span>
  );
};
