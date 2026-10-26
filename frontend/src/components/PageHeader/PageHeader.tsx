import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, actions }) => {
  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1 className="page-header d-flex align-items-center gap-2 mb-0 flex-grow-1 me-3">
          {icon && <span className="text-success">{icon}</span>}
          {title}
        </h1>
        {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="text-muted mb-0">{description}</p>}
    </div>
  );
};

