import * as React from 'react';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

export interface FormItemProps extends React.ComponentProps<typeof Field> {
  label?: React.ReactNode;
  htmlFor?: string;
  description?: React.ReactNode;
  error?: { message?: string } | null;
}

export function FormItem({
  label,
  htmlFor,
  description,
  error,
  className,
  children,
  ...props
}: FormItemProps) {
  return (
    <Field
      data-invalid={error ? true : undefined}
      className={className}
      {...props}
    >
      {label ? <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel> : null}
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError errors={[error]} /> : null}
    </Field>
  );
}
