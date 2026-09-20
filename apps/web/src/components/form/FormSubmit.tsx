import * as React from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';

export interface FormSubmitProps extends React.ComponentProps<typeof Button> {
  pendingLabel?: React.ReactNode;
}

export function FormSubmit({
  children,
  pendingLabel,
  disabled,
  ...props
}: FormSubmitProps) {
  const { formState } = useFormContext();

  return (
    <Button
      type="submit"
      disabled={disabled || formState.isSubmitting}
      {...props}
    >
      {formState.isSubmitting ? (pendingLabel ?? '保存中…') : (children ?? '保存')}
    </Button>
  );
}
