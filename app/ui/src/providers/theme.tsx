import React, {ReactNode} from 'react';
import {ThemeProvider as MuiThemeProvider} from '@mui/material/styles';
import {createTheme} from '~/theme';

interface CustomThemeProviderProps {
  children: ReactNode;
}

const theme = createTheme();

const ThemeProvider: React.FC<CustomThemeProviderProps> = ({children}) => (
  <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
);

export default ThemeProvider;
