import React from 'react';
import { Button } from 'react-bootstrap';

interface FormActionsProps {
  onCancel: () => void;
  isLoading?: boolean;
  saveText?: string;
  loadingText?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({ 
  onCancel, 
  isLoading = false, 
  saveText = 'Salvar', 
  loadingText = 'Salvando...' 
}) => {
  return (
    <div className="d-flex gap-2">
      <Button type="submit" variant="success" disabled={isLoading}>
        {isLoading ? loadingText : saveText}
      </Button>
      <Button type="button" variant="outline-secondary" onClick={onCancel} disabled={isLoading}>
        Cancelar
      </Button>
    </div>
  );
};
