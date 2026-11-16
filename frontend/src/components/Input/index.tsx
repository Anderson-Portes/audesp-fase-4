import React from 'react';
import { Form } from 'react-bootstrap';
import type { FormControlProps } from 'react-bootstrap';
import type { UseFormRegisterReturn, FieldError, Merge, FieldErrorsImpl } from 'react-hook-form';

export interface InputProps extends Omit<FormControlProps, 'label'> {
  label: React.ReactNode;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | any;
  registration?: UseFormRegisterReturn;
  containerClassName?: string;
  name?: string;
  value?: any;
  onChange?: any;
  required?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  type?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  registration, 
  containerClassName = 'mb-3', 
  className = '',
  size,
  ...props 
}) => {
  return (
    <Form.Group className={containerClassName}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        size={size}
        isInvalid={!!error}
        className={className}
        {...registration}
        {...props}
      />
      {error && (
        <Form.Control.Feedback type="invalid">
          {error.message as string}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};
