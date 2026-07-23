import type {FC, ReactNode} from 'react';
import React, {useCallback, useEffect, useState} from "react";
import {styled} from '@mui/material/styles';
import {useSections} from "./config";
import {sideBarWidthClosed, sideBarWidthOpen} from './side-nav-constants';
import {useUserPermissions} from "~/providers/user-permissions";
import Breadcrumb from "~/components/breadcrumb/breadcrumb";
import {paths} from "~/paths";
import HomeIcon from '@mui/icons-material/Home';
import {AppBar, Box, CssBaseline, IconButton, Toolbar, Typography} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import {relative} from 'path';
import {AccountButton} from './account-button';
import {LanguagePicker} from "~/components/language-picker";
// todo we're getting constant hydration errors due to the state living in local storage if we move the state to the
// server we could avoid some of those issues. but then the question is how responsive the ui will be
// for now avoiding ssr for those components seems line the way to go
import dynamic from "next/dynamic";
import SideNavLoading from "./side-nav-loading"
const SideNav = dynamic(() => import("./side-nav"), { ssr: false, loading: SideNavLoading });

import usePersistedState from '~/hooks/use-persisted-state';

const APPBAR_HEIGHT = 65;
const ENV_BANNER_HEIGHT = 26;

const LayoutRoot = styled('div')<{ hasBanner?: boolean }>(({ hasBanner }) => ({
  display: 'flex',
  flex: '1 1 auto',
  width: 'calc(100%)',
  height: `calc(100vh - ${APPBAR_HEIGHT + (hasBanner ? ENV_BANNER_HEIGHT : 0)}px)`,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'auto',
}));

const LayoutContainer = styled('div')({
  display: 'flex',
  flex: '1 1 auto',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  overflow: 'hidden', // Ensure the container does not overflow
});

const ScrollableContent = styled('div')({
  width: '100%',
  overflow: 'auto', // Make the content scrollable
});

interface LayoutProps {
  children?: ReactNode;
}

export const Layout: FC<LayoutProps> = (props) => {
  const {children} = props;
  const [isDrawerExpanded, setDrawerExpanded] = usePersistedState<boolean>(true, 'nav-collapsed');
  const [hideChildren, setHideChildren] = useState(false);
  const [appEnv, setAppEnv] = useState<string | null>(null);

  const fetchEnv = useCallback(async () => {
    try {
      const res = await fetch('/api/version');
      const data = await res.json();
      setAppEnv(data.env ?? null);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchEnv() }, [fetchEnv]);

  const toggleDrawer = () => {
    setHideChildren(true);
    setDrawerExpanded(!isDrawerExpanded);
  };

  const sections = useSections();
  const {canAccess, loading} = useUserPermissions();

  if (loading) {
    return null;
  }

  return (
    <>
      <Breadcrumb label="Home" href={paths.index()} icon={HomeIcon}/>
      <Box sx={{display: 'flex',}}>
        <CssBaseline/>
        <Box>
          {/* Sidebar */}
          <SideNav
            isDrawerExpanded={isDrawerExpanded}
            sections={sections}
            canAccess={canAccess}
            toggleDrawer={toggleDrawer}
          />
        </Box>
        <Box sx={{transition: 'width 0.3s', width: `calc(100% - ${isDrawerExpanded ? sideBarWidthOpen : sideBarWidthClosed}px)`}}>
          {/* Top AppBar */}
          <AppBar sx={{
            position: 'relative',
            backgroundColor: '#fff',
            color: '#000',
            boxShadow: 'none',
            borderBottom: '1px solid #ddd'
          }}>
            <Toolbar sx={{justifyContent: 'space-between'}}>
              <IconButton edge="start" color="inherit" onClick={toggleDrawer} sx={{mr: 2}}>
                <MenuIcon/>
              </IconButton>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                {/* <IconButton color="inherit">
                  <SettingsIcon />
                </IconButton> */}
                <LanguagePicker/>
                <AccountButton/>
              </Box>
            </Toolbar>
          </AppBar>
          {appEnv && appEnv !== 'prod' && (
            <Box sx={{
              backgroundColor: '#ff9800',
              color: '#fff',
              textAlign: 'center',
              py: 0.25,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 1 }}>
                {appEnv} environment
              </Typography>
            </Box>
          )}
          {/* Main Content */}
          <LayoutRoot id="layout-root" hasBanner={!!appEnv && appEnv !== 'prod'}>
            <LayoutContainer suppressHydrationWarning id="layout-container">
              {children}
            </LayoutContainer>
          </LayoutRoot>
        </Box>
      </Box>
    </>
  );
};
