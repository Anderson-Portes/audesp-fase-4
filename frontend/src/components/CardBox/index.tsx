import React from 'react';
import { Card as BSCard } from 'react-bootstrap';

export interface CardBoxProps {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  header?: React.ReactNode;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
}

export const CardBox: React.FC<CardBoxProps> = ({ 
  children, 
  className = '', 
  bodyClassName = 'p-4', 
  header,
  title,
  actions,
  onClick
}) => {
  return (
    <BSCard className={`border-0 shadow-sm ${className}`} onClick={onClick}>
      {header && <BSCard.Header className="bg-white py-3 border-bottom">{header}</BSCard.Header>}
      {!header && (title || actions) && (
        <BSCard.Header className="bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
          {title && typeof title === 'string' ? <h6 className="mb-0 fw-bold text-dark">{title}</h6> : title}
          {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
        </BSCard.Header>
      )}
      <BSCard.Body className={bodyClassName}>
        {children}
      </BSCard.Body>
    </BSCard>
  );
};
