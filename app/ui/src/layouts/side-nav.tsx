import { Box, Drawer, IconButton, List, SvgIcon, TextField, Toolbar, Typography, Divider } from '@mui/material'
import { Clear as ClearIcon, Menu as MenuIcon, Search as SearchIcon, Star as StarIcon } from '@mui/icons-material'
import { Permission } from '@gen/permissions'
import { SideNavSection } from './side-nav-section'
import { Item, Section } from './config'
import { Logo } from '~/components/logo'
import { config } from '~/config'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import { useGridDispatch, useGridSelector } from '~/_lib/grid/state/hooks'
import { setAccordionState, setExpandedBySearch, setSearchQuery } from '~/layouts/state/side-nav-slice'
import usePersistedState from '~/hooks/use-persisted-state'
import { FavoritesProvider } from './favorites-context'
import { useTranslation } from 'next-i18next'
import { sideBarWidthClosed, sideBarWidthOpen } from "./side-nav-constants"

interface SideNavProps {
  canAccess?: (permission: Permission) => boolean;
  sections?: Section[];
  isDrawerExpanded: boolean;
  toggleDrawer: () => void;
}

// Helper function to flatten all items from sections for search with translations
const flattenItems = (sections: Section[], t: (key: string) => string): Array<{item: Item; sectionTitle?: string; parentTitle?: string; translatedTitle: string; translatedSection?: string; translatedParent?: string}> => {
  const result: Array<{item: Item; sectionTitle?: string; parentTitle?: string; translatedTitle: string; translatedSection?: string; translatedParent?: string}> = [];

  const processItems = (items: Item[], sectionTitle?: string, parentTitle?: string) => {
    items.forEach(item => {
      result.push({
        item,
        sectionTitle,
        parentTitle,
        translatedTitle: t(item.title),
        translatedSection: sectionTitle ? t(sectionTitle) : undefined,
        translatedParent: parentTitle ? t(parentTitle) : undefined,
      });
      if (item.items) {
        processItems(item.items, sectionTitle, item.title);
      }
    });
  };

  sections.forEach(section => {
    processItems(section.items, section.subheader);
  });

  return result;
};

// Helper to get all parent titles for an item
const getParentTitles = (itemTitle: string, sections: Section[]): string[] => {
  const parents: string[] = [];

  const findParents = (items: Item[], currentParents: string[]): boolean => {
    for (const item of items) {
      if (item.title === itemTitle) {
        parents.push(...currentParents);
        return true;
      }
      if (item.items) {
        if (findParents(item.items, [...currentParents, item.title])) {
          return true;
        }
      }
    }
    return false;
  };

  sections.forEach(section => {
    findParents(section.items, []);
  });

  return parents;
};

// Helper to collect all items with paths (navigable items)
const collectNavigableItems = (sections: Section[]): Item[] => {
  const result: Item[] = [];

  const processItems = (items: Item[]) => {
    items.forEach(item => {
      if (item.path) {
        result.push(item);
      }
      if (item.items) {
        processItems(item.items);
      }
    });
  };

  sections.forEach(section => {
    processItems(section.items);
  });

  return result;
};

interface ServiceVersion {
  name: string;
  version: string;
  status: 'ok' | 'unreachable';
}

const SideNav: React.FC<SideNavProps> = ({ canAccess = () => true, sections = [], isDrawerExpanded, toggleDrawer }) => {
  const dispatch = useGridDispatch();
  const searchQuery = useGridSelector(state => state.sideNav.searchQuery);
  const { t } = useTranslation('common');
  const [serviceVersions, setServiceVersions] = useState<ServiceVersion[]>([]);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch('/api/version');
      const data = await res.json();
      setServiceVersions(data.services ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchVersions() }, [fetchVersions]);

  const [hideChildren, setHideChildren] = useState(false);
  const prevExpandedBySearchRef = useRef<string[]>([]);

  // Favorites state - stores paths of favorited items
  const [favorites, setFavorites] = usePersistedState<string[]>([], 'nav-favorites');

  const handleToggleDrawer = () => {
    setHideChildren(true);
    toggleDrawer();
  };

  useEffect(() => {
    if (hideChildren) {
      const timer = setTimeout(() => setHideChildren(false), 300);
      return () => clearTimeout(timer);
    }
  }, [hideChildren]);

  // Create fuse instance for fuzzy search with translated strings
  const fuse = useMemo(() => {
    const flatItems = flattenItems(sections, t);
    return new Fuse(flatItems, {
      keys: ['translatedTitle', 'translatedSection', 'translatedParent'],
      threshold: 0.4,
      includeMatches: true,
      ignoreLocation: true,
    });
  }, [sections, t]);

  // Filter sections based on search query and calculate items to expand
  const { filteredSections: filtered, itemsToExpand } = useMemo(() => {
    if (!searchQuery) {
      return { filteredSections: sections, itemsToExpand: [] };
    }

    const searchResults = fuse.search(searchQuery);
    const matchedItemTitles = new Set(searchResults.map(r => r.item.item.title));

    // Calculate items to expand
    const toExpand: string[] = [];
    matchedItemTitles.forEach(title => {
      const parents = getParentTitles(title, sections);
      toExpand.push(...parents);
    });

    // Filter sections and items
    const filterItems = (items: Item[]): Item[] => {
      return items
        .map(item => {
          const hasMatch = matchedItemTitles.has(item.title);
          const filteredChildren = item.items ? filterItems(item.items) : undefined;
          const hasMatchingChildren = filteredChildren && filteredChildren.length > 0;

          if (hasMatch || hasMatchingChildren) {
            return {
              ...item,
              ...(filteredChildren ? { items: filteredChildren } : {}),
            } as Item;
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null) as Item[];
    };

    const filteredSectionsList = sections
      .map(section => {
        const filteredItems = filterItems(section.items);
        if (filteredItems.length > 0) {
          return {
            ...section,
            items: filteredItems,
          };
        }
        return null;
      })
      .filter((section): section is Section => section !== null);

    return { filteredSections: filteredSectionsList, itemsToExpand: toExpand };
  }, [searchQuery, sections, fuse]);

  // Handle auto-expansion based on search results
  useEffect(() => {
    if (searchQuery && itemsToExpand.length > 0) {
      dispatch(setExpandedBySearch(itemsToExpand));

      // Expand accordions for matched items
      itemsToExpand.forEach(title => {
        dispatch(setAccordionState({ itemTitle: title, isOpen: true }));
      });

      prevExpandedBySearchRef.current = itemsToExpand;
    } else if (!searchQuery && prevExpandedBySearchRef.current.length > 0) {
      // Clear only items that were auto-expanded by search
      prevExpandedBySearchRef.current.forEach(title => {
        dispatch(setAccordionState({ itemTitle: title, isOpen: false }));
      });
      dispatch(setExpandedBySearch([]));
      prevExpandedBySearchRef.current = [];
    }
  }, [searchQuery, itemsToExpand, dispatch]);

  // Get the sections to render
  const sectionsToRender = searchQuery ? filtered : sections;

  // Get all navigable items and create favorites section as an expandable group
  const favoritesSection = useMemo(() => {
    const allItems = collectNavigableItems(sections);
    const favoriteItems = allItems.filter(item => item.path && favorites.includes(item.path));

    if (favoriteItems.length === 0) {
      return null;
    }

    // Create a favorites parent item that expands to show favorite items
    return {
      items: [{
        title: 'Favorites',
        icon: (
          <SvgIcon fontSize="small">
            <StarIcon />
          </SvgIcon>
        ),
        items: favoriteItems,
      }]
    } as Section;
  }, [sections, favorites]);

  const handleToggleFavorite = (itemPath: string) => {
    if (favorites.includes(itemPath)) {
      setFavorites(favorites.filter(fav => fav !== itemPath));
    } else {
      setFavorites([...favorites, itemPath]);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(event.target.value));
  };

  const handleClearSearch = () => {
    dispatch(setSearchQuery(''));
  };

  return (
    <Box sx={{ display: 'flex' }} data-testid="side-nav">
      <IconButton
        onClick={handleToggleDrawer}
        sx={{ position: 'fixed', top: 16, left: 16 }}
        data-testid="side-nav-toggle"
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        variant="permanent"
        anchor="left"
        data-testid="side-nav-drawer"
        sx={{
          width: isDrawerExpanded ? sideBarWidthOpen : sideBarWidthClosed,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isDrawerExpanded ? sideBarWidthOpen : sideBarWidthClosed,
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
        <FavoritesProvider favorites={favorites} onToggleFavorite={handleToggleFavorite}>
          <Toolbar sx={{ paddingLeft: '10px !important' }} data-testid="side-nav-header">
          <Box sx={{ alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}>
            <Box sx={{ width: '40px' }} data-testid="side-nav-logo">
              <Logo />
            </Box>
          </Box>
          {isDrawerExpanded && (
            <Typography
              sx={{  position: 'absolute' ,marginLeft: '50px' }}
              color="inherit"
              variant="h6"
              data-testid="side-nav-brand"
            >
              {config.BRAND_TEXT}
            </Typography>
          )}
        </Toolbar>

        {isDrawerExpanded && (
          <Box sx={{ px: 1, py: 0 }}>
            <TextField
              fullWidth
              size="small"
              value={searchQuery}
              variant={"outlined"}
              onChange={handleSearchChange}
              InputProps={{
                inputProps: {
                  ["data-testid"]:"side-nav-search"
                },
                startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 20, alignSelf: 'center' }} />,
                endAdornment: searchQuery ? (
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    data-testid="side-nav-search-clear"
                    sx={{ p: 0.5 }}
                  >
                    <ClearIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                ) : null,
                sx: {
                  fontSize: 14,
                  '& .MuiOutlinedInput-input': {
                    paddingY: "5px",
                    paddingLeft: "1px"
                  },
                  '&': {
                    paddingLeft: 1
                  }
                }
              }}
            />
          </Box>
        )}

        <List data-testid="side-nav-list">
          {/* Render favorites as expandable section when not searching */}
          {!searchQuery && favoritesSection && (
            <SideNavSection
              key="favorites"
              section={favoritesSection}
              canAccess={canAccess}
              isDrawerExpanded={isDrawerExpanded}
              hideChildren={hideChildren}
            />
          )}

          {sectionsToRender.map((section, index) => (
            <SideNavSection
              key={index}
              section={section}
              canAccess={canAccess}
              isDrawerExpanded={isDrawerExpanded}
              hideChildren={hideChildren}
            />
          ))}
        </List>

        {isDrawerExpanded && serviceVersions.length > 0 && (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Divider />
            <Box sx={{ px: 2, py: 1 }}>
              {serviceVersions.map((svc) => (
                <Typography
                  key={svc.name}
                  sx={{
                    fontSize: 11,
                    color: svc.status === 'ok' ? 'text.disabled' : 'error.main',
                    lineHeight: 1.6,
                  }}
                >
                  {svc.name}: {svc.version}
                </Typography>
              ))}
            </Box>
          </>
        )}
        </FavoritesProvider>
      </Drawer>
    </Box>
  );
};

export default SideNav;
