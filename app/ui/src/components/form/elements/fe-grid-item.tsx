/**
 * FeGridItem — internal helper used by every Fe component to wrap its
 * rendered control in a Grid item. <Form> and <FormTab> render Grid
 * containers, so each Fe must be a Grid item to participate in the
 * column layout.
 *
 * Default span is 6 (two per row), matching the legacy default.
 */

import React from 'react';
import { Grid } from '@mui/material';

export const FeGridItem: React.FC<{ xs?: number; children: React.ReactNode }> = ({
  xs = 6,
  children,
}) => <Grid item xs={xs}>{children}</Grid>;
