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
      <div className="page-header d-flex justify-content-between align-items-center mb-2">
        <h1 className="d-flex align-items-center gap-2 mb-0 fs-5 text-white flex-grow-1">
          {icon && <span>{icon}</span>}
          {title}
        </h1>
        {actions && <div className="d-flex align-items-center gap-2 ms-3">{actions}</div>}
      </div>
      {description && <p className="text-muted mb-0">{description}</p>}
    </div>
  );
};

