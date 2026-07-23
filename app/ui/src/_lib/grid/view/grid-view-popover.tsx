'use client';

import React from 'react';
import {useTranslation} from 'next-i18next';
import {toast} from 'react-hot-toast';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import LinkIcon from '@mui/icons-material/Link';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';
import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import Checkbox from '@mui/material/Checkbox';
import {filtersClear, gridReset, viewSetActive, viewToggleAutosave} from '~/_lib/grid/state/grids-slice';
import useGridView from '~/_lib/grid/hooks/use-grid-view';
import useEncodableGridState from '~/_lib/grid/hooks/use-encodable-grid-state';
import {buildShareUrl} from './grid-view-share';
import GridViewPopoverRow from './grid-view-popover-row';

interface Props {
  onClose: () => void;
  onSaveAs: () => void;
  currentHref: string;
}

const footerItemSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1.25,
  py: 1,
  borderRadius: 1,
  cursor: 'pointer',
  fontSize: 13,
  color: 'text.primary',
  '&:hover': {backgroundColor: 'action.hover'},
};

const GridViewPopover: React.FC<Props> = ({onClose, onSaveAs, currentHref}) => {
  const {t} = useTranslation('common');
  const {gridName} = useGridSettings();
  const dispatch = useGridDispatch();
  const views = useGridSelector(s => s?.grids?.views?.[gridName]) || [];
  const {activeView, save, isDirty} = useGridView();
  const {encoded} = useEncodableGridState();

  const isDefaultView = !activeView;
  const showDirtyHeader = isDefaultView || isDirty;

  const onSaveCurrent = () => {
    save();
    onClose();
  };

  const onCopyShareLink = async () => {
    if (!currentHref) return;
    const url = buildShareUrl(currentHref, encoded);
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('Link copied'));
    } catch {
      toast.error(t('Link copied'));
    }
  };

  return (
    <Box sx={{p: 0.5}}>
      {showDirtyHeader && (
        <Box
          sx={{
            backgroundColor: 'primary.lighter',
            px: 1.5,
            pt: 1.25,
            pb: 1.25,
            mx: -0.5,
            mt: -0.5,
            mb: 0.5,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{mb: 1}}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
              }}
            />
            <Box sx={{fontSize: 12, color: 'text.secondary'}}>
              {isDefaultView
                ? t('Unsaved changes in "{{name}}"', {name: t('Default')})
                : t('Unsaved changes in "{{name}}"', {name: activeView!.viewName})}
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.75}>
            {!isDefaultView && (
              <Button
                onClick={onSaveCurrent}
                variant="contained"
                size="small"
                startIcon={<SaveOutlinedIcon />}
                sx={{flex: 1, fontSize: 12, py: 0.5}}
              >
                {t('Save')}
              </Button>
            )}
            <Button
              onClick={onSaveAs}
              variant="outlined"
              size="small"
              startIcon={<NoteAddOutlinedIcon />}
              sx={{flex: 1, fontSize: 12, py: 0.5}}
              data-testid="grid-view-popover-as-new"
            >
              {t('As new')}
            </Button>
          </Stack>
        </Box>
      )}

      {views.length > 0 && (
        <Box sx={{px: 1.5, pt: 0.75, pb: 0.5, fontSize: 10, fontWeight: 500, color: 'text.secondary', letterSpacing: '0.6px', textTransform: 'uppercase'}}>
          {t('Saved views')}
        </Box>
      )}

      {views.map(view => (
        <GridViewPopoverRow
          key={view.viewName}
          view={view}
          onSelected={onClose}
        />
      ))}

      <Divider sx={{my: 0.5}} />

      {activeView && (
        <Box
          sx={{...footerItemSx, gap: 0.5}}
          onClick={(e) => {
            // forward to the checkbox so the row is the hit area
            const target = e.target as HTMLElement;
            if (target.tagName !== 'INPUT') {
              dispatch(viewToggleAutosave({gridName, viewName: activeView.viewName}));
            }
          }}
          data-testid={`grid-view-autosave-${activeView.viewName}`}
        >
          <Checkbox
            size="small"
            checked={activeView.autoSave}
            onChange={() => dispatch(viewToggleAutosave({gridName, viewName: activeView.viewName}))}
            sx={{p: 0.25, ml: 0.25}}
          />
          {t('Auto-save changes')}
        </Box>
      )}

      <Box
        onClick={() => {
          if (activeView) {
            dispatch(viewSetActive({gridName, viewName: ''}));
          }
          dispatch(gridReset({name: gridName}));
          dispatch(filtersClear({gridName}));
          onClose();
        }}
        data-testid="grid-view-reset"
        sx={footerItemSx}
      >
        <RestartAltIcon sx={{fontSize: 16, color: 'text.secondary'}} />
        {t('Reset view')}
      </Box>

      <Box
        onClick={onCopyShareLink}
        data-testid="grid-view-copy-share-link"
        sx={footerItemSx}
      >
        <LinkIcon sx={{fontSize: 16, color: 'text.secondary'}} />
        {t('Copy share link')}
      </Box>
    </Box>
  );
};

export default GridViewPopover;
