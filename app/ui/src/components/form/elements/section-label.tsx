import React from 'react';
import { Grid, Typography } from '@mui/material';

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Grid item xs={12} sx={{ mt: 1, mb: 0.25 }}>
    <Typography variant="overline" sx={{ display: 'block' }}>
      {children}
    </Typography>
  </Grid>
);
