import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string;
  actionLink?: string;
  onActionClick?: () => void;
  onAction?: () => void;
  accentClass?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  actionLabel,
  actionLink,
  onActionClick,
  onAction,
  accentClass = 'btn-primary',
}) => {
  const label = actionLabel || actionText;
  const clickHandler = onAction || onActionClick;

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {label && actionLink && (
        <Link to={actionLink} className={`btn ${accentClass}`}>
          {label}
        </Link>
      )}
      {label && clickHandler && !actionLink && (
        <button type="button" onClick={clickHandler} className={`btn ${accentClass}`}>
          {label}
        </button>
      )}
    </div>
  );
};
