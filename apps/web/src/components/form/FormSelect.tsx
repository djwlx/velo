import * as React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { FormField } from './FormField';
import type { FormItemProps } from './FormItem';

export type FormSelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<FormItemProps, 'htmlFor' | 'error' | 'children'> & {
  control: Control<TFieldValues>;
  name: TName;
  items: Record<string, React.ReactNode>;
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
  children?: React.ReactNode;
};

export function FormSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  className,
  items,
  placeholder,
  disabled,
  triggerClassName,
  children,
  ...props
}: FormSelectProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      className={className}
      {...props}
    >
      {(field) => (
        <Select
          items={items}
          value={field.value}
          onValueChange={(value) => field.onChange(value)}
          disabled={disabled}
        >
          <SelectTrigger
            id={field.name}
            className={cn('w-full', triggerClassName)}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {children ??
              Object.entries(items).map(([value, optionLabel]) => (
                <SelectItem key={value} value={value}>
                  {optionLabel}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}
