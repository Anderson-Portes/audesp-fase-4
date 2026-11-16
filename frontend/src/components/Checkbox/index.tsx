import React from 'react';
import { Form } from 'react-bootstrap';
import type { UseFormRegisterReturn, FieldError, Merge, FieldErrorsImpl } from 'react-hook-form';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  id: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | any;
  registration?: UseFormRegisterReturn;
  containerClassName?: string;
  labelClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, error, registration, containerClassName = '', labelClassName = '', className = '', ...props }, ref) => {
    return (
      <Form.Group className={containerClassName}>
        <Form.Check
          type="checkbox"
          id={id}
          label={label}
          isInvalid={!!error}
          className={`${labelClassName} ${className}`}
          ref={ref}
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
  }
);
