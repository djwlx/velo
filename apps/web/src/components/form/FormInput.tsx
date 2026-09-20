import * as React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { Input } from '@/components/ui/input';

import { FormField } from './FormField';

export type FormInputProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<
  React.ComponentProps<typeof Input>,
  'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'ref'
> & {
  control: Control<TFieldValues>;
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  fieldClassName?: string;
};

export function FormInput<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  fieldClassName,
  ...inputProps
}: FormInputProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      className={fieldClassName}
    >
      {(field, fieldState) => (
        <Input
          {...field}
          id={field.name}
          aria-invalid={fieldState.invalid}
          {...inputProps}
        />
      )}
    </FormField>
  );
}
