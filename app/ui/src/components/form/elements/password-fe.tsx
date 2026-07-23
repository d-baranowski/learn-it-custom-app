/**
 * PasswordFe — password input with show/hide toggle.
 * Wraps StringFe for value plumbing.
 */

import React, { useState } from 'react';
import { IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { StringFe, StringFeProps } from './string-fe';

export interface PasswordFeProps
  extends Omit<StringFeProps, 'type' | 'InputProps'> {
  /** Show/hide toggle; default true. */
  showToggle?: boolean;
}

export const PasswordFe: React.FC<PasswordFeProps> = ({
  showToggle = true,
  ...rest
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <StringFe
      {...rest}
      type={visible ? 'text' : 'password'}
      InputProps={
        showToggle
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    edge="end"
                    onClick={() => setVisible((v) => !v)}
                  >
                    {visible ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : undefined
      }
    />
  );
};
