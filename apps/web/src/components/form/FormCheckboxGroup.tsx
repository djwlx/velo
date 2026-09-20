import * as React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { FieldTitle } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import { FormField } from './FormField';
import type { FormItemProps } from './FormItem';

export interface FormCheckboxOption {
  value: string | number;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export type FormCheckboxGroupProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<FormItemProps, 'htmlFor' | 'error' | 'children'> & {
  control: Control<TFieldValues>;
  name: TName;
  options: FormCheckboxOption[];
  emptyText?: React.ReactNode;
  optionClassName?: string;
};

export function FormCheckboxGroup<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  className,
  options,
  emptyText = '暂无可选项',
  optionClassName,
  ...props
}: FormCheckboxGroupProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      description={description}
      className={className}
      {...props}
    >
      {(field) => {
        const selected = field.value as Array<string | number>;

        return (
          <>
            {label ? <FieldTitle>{label}</FieldTitle> : null}
            <div className="flex flex-col gap-2">
              {options.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  {emptyText}
                </span>
              ) : (
                options.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      optionClassName
                    )}
                  >
                    <Checkbox
                      checked={selected.includes(option.value)}
                      disabled={option.disabled}
                      onCheckedChange={(checked) => {
                        field.onChange(
                          checked
                            ? [...selected, option.value]
                            : selected.filter((value) => value !== option.value)
                        );
                      }}
                    />
                    <span className="flex flex-col">
                      <span>{option.label}</span>
                      {option.description ? (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))
              )}
            </div>
          </>
        );
      }}
    </FormField>
  );
}
