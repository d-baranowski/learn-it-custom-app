/**
 * CancelButton — cancel/dismiss the surrounding <Form>.
 *
 * Disables itself while submission is in flight so users can't dismiss
 * mid-mutation. The actual close behavior is the caller's job (typically
 * via the windowing system — the form's parent passes `onCancel` to the
 * <Form> which can call this directly, or the caller wires onClick).
 */

import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormFlags } from '~/_lib/forms/state/hooks';

export interface CancelButtonProps extends Omit<ButtonProps, 'type'> {
  /** Override formId when not inside a <Form>. */
  formId?: string;
  children?: React.ReactNode;
}

export const CancelButton: React.FC<CancelButtonProps> = ({
  formId: propFormId,
  children,
  disabled,
  ...buttonProps
}) => {
  const { t } = useTranslation('common');
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const flags = useFormFlags(formId);
  const label = children ?? t('Cancel');

  return (
    <Button
      {...buttonProps}
      type="button"
      variant={buttonProps.variant ?? 'contained'}
      disabled={disabled || flags.isSubmitting}
      data-testid={(buttonProps as { 'data-testid'?: string })['data-testid'] ?? 'form-cancel-btn'}
    >
      {label}
    </Button>
  );
};
