import * as React from 'react';
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { FormItem, type FormItemProps } from './FormItem';

export interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<FormItemProps, 'htmlFor' | 'error' | 'children'> {
  control: Control<TFieldValues>;
  name: TName;
  children: (
    field: ControllerRenderProps<TFieldValues, TName>,
    fieldState: ControllerFieldState
  ) => React.ReactNode;
}

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  className,
  children,
  ...props
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem
          label={label}
          description={description}
          htmlFor={field.name}
          error={fieldState.error}
          className={className}
          {...props}
        >
          {children(field, fieldState)}
        </FormItem>
      )}
    />
  );
}
