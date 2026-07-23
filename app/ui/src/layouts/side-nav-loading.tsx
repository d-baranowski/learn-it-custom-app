import { Box, Drawer, IconButton, TextField, Toolbar, Typography } from '@mui/material'
import { Menu as MenuIcon, Search as SearchIcon } from '@mui/icons-material'
import { Logo } from '~/components/logo'
import { config } from '~/config'
import React from 'react'
import { sideBarWidthOpen } from './side-nav-constants'
import Skeleton from '@mui/material/Skeleton'

const SideNavLoading: React.FC = () => {
  return (
    <Box sx={{ display: 'flex' }} data-testid="side-nav-loading">
      <IconButton
        sx={{ position: 'fixed', top: 16, left: 16 }}
        data-testid="side-nav-toggle-loading"
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        variant="permanent"
        anchor="left"
        data-testid="side-nav-drawer"
        sx={{
          width: sideBarWidthOpen,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sideBarWidthOpen,
            overflowX: 'hidden',
            transition: 'width 0.3s',
            boxSizing: 'border-box',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            msOverflowStyle: 'none',  // IE and Edge
            scrollbarWidth: 'none',  // Firefox
          },
        }}
      >
        <Toolbar sx={{ paddingLeft: '10px !important' }} data-testid="side-nav-header">
          <Box sx={{ alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}>
            <Box sx={{ width: '40px' }} data-testid="side-nav-logo">
              <Logo />
            </Box>
          </Box>
          <Typography
            sx={{ position: 'absolute', marginLeft: '50px' }}
            color="inherit"
            variant="h6"
            data-testid="side-nav-brand"
          >
            {config.BRAND_TEXT}
          </Typography>
        </Toolbar>

        <Box sx={{ px: 1, py: 0 }}>
          <TextField
            fullWidth
            disabled
            size="small"
            variant={'outlined'}
            InputProps={{
              inputProps: {
                ['data-testid']: 'side-nav-search',
              },
              startAdornment: <SearchIcon
                sx={{ mr: 0.5, color: 'text.secondary', fontSize: 20, alignSelf: 'center' }} />,
              sx: {
                fontSize: 14,
                '& .MuiOutlinedInput-input': {
                  paddingY: '5px',
                  paddingLeft: '1px',
                },
                '&': {
                  paddingLeft: 1,
                },
              },
            }}
          />
        </Box>
        <Box sx={{ px: 1, py: 1 }}>
          { Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} width={sideBarWidthOpen - 15} />) }
        </Box>
      </Drawer>
    </Box>
  )
}

export default SideNavLoading
