/**
 * FormActions — full-width row of action buttons inside a <Form>.
 *
 * <Form> wraps its children in a `<Grid container>` so every direct child
 * needs to be a Grid item. Action buttons are usually placed in a row using
 * MUI Stack — wrap them once in this helper so the layout is consistent and
 * the row spans the full width regardless of grid column defaults.
 */

import React from 'react';
import { Divider, Grid, Stack, StackProps } from '@mui/material';

export interface FormActionsProps {
  children: React.ReactNode;
  /** Stack direction. Defaults to "row". */
  direction?: StackProps['direction'];
  /** Stack spacing between items. Defaults to 1. */
  spacing?: StackProps['spacing'];
  /** Override Grid item width. Defaults to 12 (full width). */
  xs?: number;
  /** Optional sx applied to the inner Stack. */
  sx?: StackProps['sx'];
  /** Render a hairline divider above the actions, spanning modal width. */
  withDivider?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  direction = 'row',
  spacing = 1,
  xs = 12,
  sx,
  withDivider,
}) => (
  <Grid item xs={xs} sx={{ mt: withDivider ? 2 : 1 }}>
    {withDivider ? <Divider sx={{ mx: -3, mb: 2 }} /> : null}
    <Stack
      direction={direction}
      spacing={spacing}
      justifyContent="flex-end"
      alignItems="center"
      sx={sx}
    >
      {children}
    </Stack>
  </Grid>
);
