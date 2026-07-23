import type {FC} from 'react';
import {useMemo} from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import {useTheme} from '@mui/material/styles';
import {Logo} from 'src/components/logo';
import {RouterLink} from 'src/components/router-link';
import {Scrollbar} from 'src/components/scrollbar';
import {usePathname} from 'src/hooks/use-pathname';
import {paths} from '~/paths';
import {AccountButton} from './account-button';
import type {Section} from './config';
import {TopNavSection} from './top-nav-section';
import Typography from '@mui/material/Typography';
import {Permission} from "@gen/permissions";
import {config} from "~/config";
import {LanguagePicker} from '~/components/language-picker';

const useCssVars = (): Record<string, string> => {
  const theme = useTheme();

  return useMemo((): Record<string, string> => ({
    '--nav-bg': theme.palette.neutral[800],
    '--nav-color': theme.palette.common.white,
    '--nav-divider-color': theme.palette.neutral[700],
    '--nav-border-color': 'transparent',
    '--nav-logo-border': theme.palette.neutral[700],
    '--nav-item-color': '#16151C',
    '--nav-item-hover-bg': 'rgba(255, 255, 255, 0.04)',
    '--nav-item-active-bg': 'rgba(255, 255, 255, 0.04)',
    '--nav-item-active-color': theme.palette.primary.main,
    '--nav-item-disabled-color': theme.palette.neutral[500],
    '--nav-item-icon-color': '#16151C',
    '--nav-item-icon-active-color': theme.palette.primary.main,
    '--nav-item-icon-disabled-color': theme.palette.neutral[500],
    '--nav-item-chevron-color': theme.palette.neutral[600],
    '--nav-scrollbar-color': theme.palette.neutral[400],
  }), [theme]);
};

interface TopNavProps {
  canAccess?: (permission: Permission) => boolean;
  sections?: Section[];
}

export const TopNav: FC<TopNavProps> = (props) => {
  const { canAccess, sections = [] } = props;
  const pathname = usePathname();

  const cssVars = useCssVars();

  return (
    <Box
      component="header"
      sx={{
        ...cssVars,
        backgroundColor: '#A2A1A80D',
        left: 0,
        top: 0,
        margin: 2,
        borderRadius: 2,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={2}
        sx={{
          px: 3,
          py: 1,
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          spacing={2}
        >
          <Box
            component={RouterLink}
            href={paths.index()}
            sx={{
              display: 'inline-flex',
              height: 40,
              p: '2px',
              width: 40,
            }}
          >
            <Logo />
          </Box>

          <Stack
            alignItems="center"
            direction="row"
            spacing={0}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                color="inherit"
                variant="h6"
              >
                {config.BRAND_TEXT}
              </Typography>
            </Box>

          </Stack>
        </Stack>
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
        >
          {/*<BugReportButton/>*/}
          {/*<NotificationsButton/>*/}
          {/*<SearchButton/>*/}
          <LanguagePicker />
          <AccountButton />
        </Stack>
      </Stack>
      <Box>
        <Scrollbar
          sx={{
            '& .simplebar-scrollbar:before': {
              background: 'var(--nav-scrollbar-color)',
            },
          }}
        >
          <Stack
            alignItems="center"
            component="nav"
            direction="row"
            spacing={1}
            sx={{
              px: 2,
              py: 1.5,
            }}
          >
            {sections.map((section, index) => (
              <TopNavSection
                canAccess={canAccess}
                items={section.items}
                key={index}
                pathname={pathname}
                subheader={section.subheader}
              />
            ))}
          </Stack>
        </Scrollbar>
      </Box>
    </Box>
  );
};
