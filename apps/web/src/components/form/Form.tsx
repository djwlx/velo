import * as React from 'react';
import {
  FormProvider,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';

import { cn } from '@/lib/utils';

export interface FormProps<TFieldValues extends FieldValues>
  extends Omit<React.ComponentProps<'form'>, 'onSubmit'> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (values: TFieldValues) => void | Promise<void>;
}

export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
  ...props
}: FormProps<TFieldValues>) {
  const handleSubmit = form.handleSubmit((values) =>
    Promise.resolve(onSubmit(values)).catch(() => undefined)
  );

  return (
    <FormProvider {...form}>
      <form
        className={cn('flex flex-col gap-4', className)}
        onSubmit={handleSubmit}
        noValidate
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}
