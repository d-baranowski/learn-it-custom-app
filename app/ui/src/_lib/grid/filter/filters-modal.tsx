import {Grid} from '@gen/grids';
import React, { ReactNode, useEffect } from 'react';
import {filterBuilder} from '~/_lib/grid/filter/builder';
import MuiGrid from '@mui/material/Grid';
import DividerLabel from '~/components/divider-label';
import Fuse from 'fuse.js'; // Fuzzy search library
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import useFiltersModal from '~/_lib/grid/hooks/use-filters-modal';
import {useTranslation} from 'next-i18next';
import { InPortal } from '~/_lib/portals/in-out-portals';

interface Props {
  grid: Grid;
}

function FiltersModal(props: Props): ReactNode {
  const { t } = useTranslation('common');

  const { grid } = props;
  const [searchTerm, setSearchTerm] = React.useState('');

  const registryName = grid.name + '_filters-modal';

  const groups = React.useMemo(() => {
    // Only proto-declared form filters belong in the modal. Also drop
    // *Label / *Labels denormalised projections — the codegen defaults
    // every field to form: true, so we filter them at the UI layer.
    const formFilters = grid.filters.filter(
      (f) => f.form && !f.id.endsWith('Label') && !f.id.endsWith('Labels')
    );
    const g = filterBuilder(formFilters, t, false);
    return Object.values(g).sort((a, b) => {
      return b.priority - a.priority;
    });
  }, [grid, t]);

  // Extract searchable criteria from all elements
  const searchableElements = React.useMemo(() => {
    return groups.flatMap((g) => {
      const elementsWithCriteria = extractSearchableCriteria(g.elements);
      return elementsWithCriteria.map((item) => ({
        ...item,
        groupId: g.id, // Keep track of group
        groupTitle: g.title, // Include group title in the search
      }));
    });
  }, [groups]);

  // Set up Fuse for fuzzy searching - only when we have valid searchable elements
  const fuse = React.useMemo(() => {
    if (!searchableElements || searchableElements.length === 0) {
      return null;
    }
    return new Fuse(searchableElements, {
      keys: ['id', 'name', 'label', 'title', 'groupTitle'],
      threshold: 0.3,
      includeScore: false,
    });
  }, [searchableElements]);

  const filteredGroups = React.useMemo(() => {
    if (!searchTerm || !fuse) return groups;

    // Perform the fuzzy search
    const searchResults = fuse.search(searchTerm);

    // Group the results by groupId and return the filtered groups
    const groupMap: Record<string, (typeof groups)[number]> = {};

    searchResults.forEach((result) => {
      const group = groups.find((g) => g.id === result.item.groupId);
      if (group) {
        if (!groupMap[group.id]) {
          groupMap[group.id] = { ...group, elements: [] };
        }
        groupMap[group.id].elements.push(result.item.element);
      }
    });

    return Object.values(groupMap);
  }, [searchTerm, groups, fuse]);

  const { isOpen } = useFiltersModal();

  return (
    <InPortal open={isOpen} targetId={registryName}>
      <div style={{ width: '100%', paddingTop: '10px' }}>
        {/* Search Bar */}
        <MuiGrid container spacing={1} sx={{ marginBottom: 2 }}>
          <MuiGrid item xs={12}>
            <TextField
              placeholder={t('Search filters...')}
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16 }} />
                  </InputAdornment>
                ),
              }}
            />
          </MuiGrid>
        </MuiGrid>
        <MuiGrid
          container
          spacing={1}
          sx={{
            marginBottom: 1,
            '& .MuiInputAdornment-root svg': {
              fontSize: '16px',
              width: '16px',
              height: '16px',
            },
            '& .MuiAutocomplete-root .MuiSvgIcon-root': {
              fontSize: '18px',
            },
          }}
        >
          {filteredGroups.map((g) => (
            <React.Fragment key={g.id}>
              <DividerLabel>{t(g.title)}</DividerLabel>
              {g.elements.map((element, index) => (
                <React.Fragment key={index}>{element}</React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </MuiGrid>
      </div>
    </InPortal>
  );
}

// Recursive function to extract searchable fields from React elements
function extractSearchableCriteria(elements: React.ReactNode): {
  id?: string;
  name?: string;
  title?: string;
  element: React.ReactElement;
}[] {
  const results: {
    id?: string;
    name?: string;
    title?: string;
    label?: string;
    element: React.ReactElement;
  }[] = [];

  function traverse(element: React.ReactNode) {
    if (!React.isValidElement(element)) return;

    const { id, name, title, label } = element.props;

    // Collect elements with searchable props
    if (id || name || title || label) {
      results.push({
        id,
        name,
        title,
        label,
        element,
      });
    }

    // Recursively search through children
    if (element.props.children) {
      React.Children.forEach(element.props.children, traverse);
    }
  }

  React.Children.forEach(elements, traverse);

  return results;
}

export default FiltersModal;
