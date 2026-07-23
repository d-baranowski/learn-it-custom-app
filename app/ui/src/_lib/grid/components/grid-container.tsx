import {styled} from '@mui/material/styles';

export const GridContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({theme, open}) => ({
  flexGrow: 1,
  overflow: 'auto',
  overflowY: "hidden",
  paddingLeft: theme.spacing(2), //3
  paddingRight: theme.spacing(2),  //3
  paddingTop: theme.spacing(2), //8
  paddingBottom: theme.spacing(2),
  zIndex: 1,
  [theme.breakpoints.up('lg')]: {
    marginLeft: -320,
  },
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    [theme.breakpoints.up('lg')]: {
      marginLeft: -20,
    },
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

export const StaticGridContainer = styled('div')(({theme}) => ({
  flexGrow: 1,
  overflow: 'auto',
  overflowY: 'hidden',
  paddingLeft: theme.spacing(2), // 3
  paddingRight: theme.spacing(2), // 3
  paddingTop: theme.spacing(2), // 8
  paddingBottom: 0,
  zIndex: 1,
  [theme.breakpoints.up('lg')]: {
    marginRight: 5,
    marginLeft: 0,
  },
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));
