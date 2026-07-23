import React, {useEffect, useState} from 'react';
import {Collapse, List, ListItemButton, ListItemIcon, ListItemText, useTheme, IconButton, Tooltip, Menu, MenuItem, Box, Typography} from '@mui/material';
import {RouterLink} from 'src/components/router-link';
import {useTranslation} from 'next-i18next';
import {Permission} from '@gen/permissions';
import {ExpandLess, ExpandMore, Star, StarBorder, Close} from '@mui/icons-material';
import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import {toggleAccordion, setAccordionState} from '~/layouts/state/side-nav-slice';
import {useFavorites} from './favorites-context';

interface Item {
  active?: boolean;
  disabled?: boolean;
  external?: boolean;
  icon?: React.ReactNode;
  items?: Item[];
  label?: React.ReactNode;
  path?: string;
  title: string;
  subject?: Permission;
  canAccess?: (subject: Permission) => boolean;
}

interface SideNavItemProps {
  item: Item;
  depth?: number;
  canAccess: (subject: Permission) => boolean;
  isDrawerExpanded: boolean;
  hideChildren: boolean;
}

// Helper function to create testid from title
const createTestId = (title: string) => {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

// Helper function to escape special regex characters
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper function to highlight matching text
const HighlightedText: React.FC<{ text: string; searchQuery: string }> = ({ text, searchQuery }) => {
  const theme = useTheme();

  if (!searchQuery) return <>{text}</>;

  const escapedQuery = escapeRegExp(searchQuery);
  const lowerSearchQuery = searchQuery.toLowerCase();
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === lowerSearchQuery ? (
          <mark
            key={`${index}-${part}`}
            style={{
              backgroundColor: theme.palette.warning.light,
              padding: 0,
              color: theme.palette.getContrastText(theme.palette.warning.light)
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={`${index}-${part}`}>{part}</span>
        )
      )}
    </span>
  );
};

export const SideNavItem: React.FC<SideNavItemProps> = ({
  item,
  depth = 0,
  canAccess,
  isDrawerExpanded,
  hideChildren
}) => {
  const { t } = useTranslation('common');
  const dispatch = useGridDispatch();
  const open = useGridSelector(state => state.sideNav.accordionStates[item.title] || false);
  const searchQuery = useGridSelector(state => state.sideNav.searchQuery);
  const { favorites, onToggleFavorite } = useFavorites();

  // State for collapsed menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    if (hideChildren) {
      dispatch(setAccordionState({ itemTitle: item.title, isOpen: false }));
    }
  }, [hideChildren, dispatch, item.title]);

  if (item.subject && !canAccess(item.subject)) {
    return null;
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    // If drawer is collapsed and item has children, open popup menu
    if (!isDrawerExpanded && item.items && item.items.length > 0) {
      event.preventDefault();
      setAnchorEl(event.currentTarget);
    } else if (isDrawerExpanded && item.items) {
      // If drawer is expanded and item has children, toggle accordion
      dispatch(toggleAccordion({ itemTitle: item.title }));
    }
    // Otherwise, let the link navigate (default behavior)
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFavoriteClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (item.path) {
      onToggleFavorite(item.path);
    }
  };

  const isFavorite = item.path ? favorites.includes(item.path) : false;

  const linkProps = item.path
    ? item.external
      ? {
          component: 'a',
          href: item.path,
          target: '_blank',
        }
      : {
          component: RouterLink,
          href: item.path,
        }
    : {};

  const testId = createTestId(item.title);
  const translatedTitle = t(item.title);

  const listItemButton = (
    <ListItemButton
      disabled={item.disabled}
      key={item.title}
      onClick={handleClick}
      {...linkProps}
      data-testid={`side-nav-item-${testId}`}
      sx={{
        ...(item.active && {
          backgroundColor: 'var(--nav-item-active-bg)',
        }),
        '&:hover': {
          backgroundColor: '#e8e3fa',
          '& .favorite-icon': {
            opacity: 1,
          },
        },
      }}
    >
      {item.icon && (
        <ListItemIcon
          sx={{ minWidth: 30, color: depth > 0 ? 'text.secondary' : 'primary.main'}}
          data-testid={`side-nav-icon-${testId}`}
        >
          {item.icon}
        </ListItemIcon>
      )}
      {isDrawerExpanded && (
        <ListItemText
          primary={<HighlightedText text={translatedTitle} searchQuery={searchQuery} />}
          data-testid={`side-nav-text-${testId}`}
          primaryTypographyProps={{
            sx: {
              color: 'text.secondary',
              fontSize: 14,
              fontWeight: 500,
            },
          }}
        />
      )}
      {item.path && isDrawerExpanded && (
        <IconButton
          size="small"
          onClick={handleFavoriteClick}
          data-testid={`side-nav-favorite-${testId}`}
          className="favorite-icon"
          sx={{
            p: 0.5,
            ml: 0.5,
            opacity: isFavorite ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            color: isFavorite ? 'warning.main' : 'action.disabled',
            '&:hover': {
              color: 'warning.main',
            }
          }}
        >
          {isFavorite ? <Star sx={{ fontSize: 18 }} /> : <StarBorder sx={{ fontSize: 18 }} />}
        </IconButton>
      )}
      {item.items && isDrawerExpanded && (
        <div data-testid={`side-nav-expand-${testId}`}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </div>
      )}
    </ListItemButton>
  );

  return (
    <>
      {!isDrawerExpanded ? (
        <Tooltip title={translatedTitle} placement="right">
          {listItemButton}
        </Tooltip>
      ) : (
        listItemButton
      )}

      {/* Menu for collapsed state when item has children */}
      {!isDrawerExpanded && item.items && item.items.length > 0 && (
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          sx={{
            ml: 1,
          }}
        >
          {/* Header with title and close button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {translatedTitle}
            </Typography>
            <IconButton
              size="small"
              onClick={handleMenuClose}
              sx={{ ml: 1 }}
              data-testid={`side-nav-menu-close-${testId}`}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Menu items */}
          {item.items.filter(childItem => !childItem.subject || canAccess(childItem.subject)).map((childItem) => (
            <MenuItem
              key={childItem.title}
              onClick={handleMenuClose}
              component={childItem.path ? (childItem.external ? 'a' : RouterLink) : 'li'}
              href={childItem.path}
              target={childItem.external ? '_blank' : undefined}
              sx={{
                minWidth: 200,
                ...(childItem.active && {
                  backgroundColor: 'action.selected',
                }),
              }}
            >
              {childItem.icon && (
                <ListItemIcon sx={{ minWidth: 30, color: 'text.secondary' }}>
                  {childItem.icon}
                </ListItemIcon>
              )}
              <ListItemText
                primary={t(childItem.title)}
                primaryTypographyProps={{
                  sx: {
                    fontSize: 14,
                    fontWeight: 500,
                  },
                }}
              />
            </MenuItem>
          ))}
        </Menu>
      )}

      {isDrawerExpanded && item.items  && (
        <Collapse
          in={open}
          timeout="auto"
          unmountOnExit
          data-testid={`side-nav-submenu-${testId}`}
        >
          <List component="div" disablePadding sx={{ pl: 4 }}> {/* Indent child items */}
            {item.items.map((childItem) => (
              <SideNavItem
                key={childItem.title}
                item={childItem}
                depth={depth + 1}
                canAccess={canAccess}
                isDrawerExpanded={isDrawerExpanded}
                hideChildren={hideChildren}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};
