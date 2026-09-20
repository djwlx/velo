import * as React from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

export interface FormCheckboxProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  checkboxClassName?: string;
}

export function FormCheckbox<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  disabled,
  className,
  checkboxClassName,
}: FormCheckboxProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          orientation="horizontal"
          data-invalid={fieldState.invalid}
          data-disabled={disabled}
          className={className}
        >
          <Checkbox
            id={field.name}
            checked={Boolean(field.value)}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            onCheckedChange={(checked) => field.onChange(checked)}
            className={checkboxClassName}
          />
          {label ? (
            <FieldLabel htmlFor={field.name} className="font-normal">
              {label}
            </FieldLabel>
          ) : null}
          {description ? (
            <FieldDescription>{description}</FieldDescription>
          ) : null}
          {fieldState.invalid ? (
            <FieldError errors={[fieldState.error]} />
          ) : null}
        </Field>
      )}
    />
  );
}
