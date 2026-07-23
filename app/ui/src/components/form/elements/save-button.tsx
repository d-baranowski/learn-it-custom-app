/**
 * SaveButton — submits the surrounding <Form>.
 *
 * Reads the formId from FormContext, derives disabled state from
 * useFormFlags (disabled while !isDirty || isSubmitting by default).
 * Click dispatches formSubmitStarted; the validation middleware takes it
 * from there.
 *
 * While the form is submitting, the button shows a spinner so the user
 * has a visible "saving…" cue instead of just a disabled button. Cypress
 * tests can read `data-saving="true"` to assert in-flight state without
 * watching network calls.
 */

import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useFormCanSubmit, useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormFlags } from '~/_lib/forms/state/hooks';

export interface SaveButtonProps extends Omit<ButtonProps, 'onClick' | 'type'> {
  /** Override the default disabled rule (which is `!isDirty || isSubmitting`). */
  disabledOverride?: boolean;
  /** Override formId when not inside a <Form>. */
  formId?: string;
  /**
   * If true (default), require the form to be dirty before Save is enabled.
   * Forms that allow saving an unchanged copy can pass false.
   */
  requireDirty?: boolean;
  children?: React.ReactNode;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  disabledOverride,
  formId: propFormId,
  requireDirty = true,
  children,
  ...buttonProps
}) => {
  const { t } = useTranslation('common');
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const flags = useFormFlags(formId);
  const canSubmit = useFormCanSubmit();
  const label = children ?? t('Save');

  const defaultDisabled =
    !canSubmit || (requireDirty && !flags.isDirty) || flags.isSubmitting;
  const disabled = disabledOverride ?? defaultDisabled;

  // No onClick — the parent <Form> component renders a real <form> element
  // and intercepts onSubmit. type="submit" + Enter key wiring come for free.
  return (
    <Button
      {...buttonProps}
      type="submit"
      variant={buttonProps.variant ?? 'contained'}
      color={buttonProps.color ?? 'primary'}
      disabled={disabled}
      data-testid={(buttonProps as { 'data-testid'?: string })['data-testid'] ?? 'form-submit-btn'}
      data-saving={flags.isSubmitting ? 'true' : 'false'}
      startIcon={
        flags.isSubmitting ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          buttonProps.startIcon
        )
      }
    >
      {label}
    </Button>
  );
};
