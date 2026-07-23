/**
 * SwitchFe / BooleanFe — boolean field bound to Redux form state.
 *
 * SwitchFe renders an MUI Switch (the iOS-style toggle).
 * BooleanFe renders an MUI Checkbox — preferred for plain on/off form
 * fields where the switch's stateful look is overkill. Both share an
 * implementation; the only difference is the control component.
 */

import React from 'react';
import {
  Box,
  Checkbox,
  CheckboxProps,
  FormControlLabel,
  Grid,
  Switch,
  SwitchProps,
  Typography,
} from '@mui/material';
import { kebabCase } from 'change-case';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { useDefaultLabel } from './use-default-label';

export interface SwitchFeProps {
  name: string;
  label?: string;
  disabled?: boolean;
  switchProps?: Partial<SwitchProps>;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

export const SwitchFe: React.FC<SwitchFeProps> = ({
  name,
  label,
  disabled,
  switchProps,
  formId: propFormId,
  dataTestId,
  xs = 6,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { field } = useFormController<boolean>({ formId, name });

  return (
    <Grid item xs={xs}>
      <FormControlLabel
        control={
          <Switch
            checked={!!field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            onBlur={field.onBlur}
            disabled={disabled}
            inputProps={
              {
                'data-testid': dataTestId ?? kebabCase(name),
              } as React.InputHTMLAttributes<HTMLInputElement>
            }
            {...switchProps}
          />
        }
        label={resolvedLabel}
      />
    </Grid>
  );
};

export interface BooleanFeProps {
  name: string;
  label?: string;
  disabled?: boolean;
  checkboxProps?: Partial<CheckboxProps>;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 6. */
  xs?: number;
}

export const BooleanFe: React.FC<BooleanFeProps> = ({
  name,
  label,
  disabled,
  checkboxProps,
  formId: propFormId,
  dataTestId,
  xs = 6,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { field } = useFormController<boolean>({ formId, name });

  return (
    <Grid item xs={xs}>
      <FormControlLabel
        control={
          <Checkbox
            checked={!!field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            onBlur={field.onBlur}
            disabled={disabled}
            inputProps={
              {
                'data-testid': dataTestId ?? kebabCase(name),
              } as React.InputHTMLAttributes<HTMLInputElement>
            }
            {...checkboxProps}
          />
        }
        label={resolvedLabel}
      />
    </Grid>
  );
};

export interface SwitchRowFeProps {
  name: string;
  label?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  switchProps?: Partial<SwitchProps>;
  formId?: string;
  dataTestId?: string;
  /** Grid item span (1-12). Defaults to 12. */
  xs?: number;
  divider?: boolean;
}

export const SwitchRowFe: React.FC<SwitchRowFeProps> = ({
  name,
  label,
  description,
  disabled,
  switchProps,
  formId: propFormId,
  dataTestId,
  xs = 12,
  divider = false,
}) => {
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const resolvedLabel = useDefaultLabel(name, label);
  const { field } = useFormController<boolean>({ formId, name });

  return (
    <Grid item xs={xs}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          py: 1.25,
          borderBottom: divider ? '0.5px solid #E0DED5' : 'none',
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {resolvedLabel}
          </Typography>
          {description ? (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        <Switch
          checked={!!field.value}
          onChange={(e) => field.onChange(e.target.checked)}
          onBlur={field.onBlur}
          disabled={disabled}
          inputProps={
            {
              'data-testid': dataTestId ?? kebabCase(name),
            } as React.InputHTMLAttributes<HTMLInputElement>
          }
          {...switchProps}
        />
      </Box>
    </Grid>
  );
};
