'use client';

import React from 'react';
import {useTranslation} from 'next-i18next';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

type Mode = 'create' | 'rename';

interface Props {
  anchorEl: HTMLElement | null;
  mode: Mode;
  initialName: string;
  existingNames: string[];
  /** Names that should still be considered "free" (e.g. the row being renamed). */
  ignoreName?: string;
  onClose: () => void;
  onSubmit: (name: string, fromCurrent: boolean) => void;
}

const GridViewNamePopover: React.FC<Props> = ({
  anchorEl,
  mode,
  initialName,
  existingNames,
  ignoreName,
  onClose,
  onSubmit,
}) => {
  const {t} = useTranslation('common');
  const [name, setName] = React.useState(initialName);
  const [fromCurrent, setFromCurrent] = React.useState(true);

  React.useEffect(() => {
    if (anchorEl) {
      setName(initialName);
      setFromCurrent(true);
    }
  }, [anchorEl, initialName]);

  const trimmed = name.trim();
  const taken = existingNames.some(n => n === trimmed && n !== ignoreName);
  const canSubmit = trimmed.length > 0 && !taken;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(trimmed, fromCurrent);
  };

  const title = mode === 'create' ? t('New view') : t('Rename');
  const confirmLabel = mode === 'create' ? t('Create') : t('Save');

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
      transformOrigin={{vertical: 'top', horizontal: 'right'}}
      slotProps={{paper: {sx: {mt: 1, width: 320, borderRadius: 1, p: 1.75}}}}
    >
      <Box sx={{fontSize: 13, fontWeight: 500, color: 'text.primary', mb: 1.5}}>
        {title}
      </Box>

      <TextField
        autoFocus
        fullWidth
        label={t('View name')}
        value={name}
        error={taken}
        helperText={taken ? t('This name is already used') : ' '}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onClose();
        }}
        inputProps={{'data-testid': 'grid-view-name-input'}}
        sx={{mb: 1}}
      />

      {mode === 'create' && (
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{px: 0.5, mb: 1.5}}>
          <Checkbox
            size="small"
            checked={fromCurrent}
            onChange={(e) => setFromCurrent(e.target.checked)}
            sx={{p: 0, mt: '2px'}}
            inputProps={{'aria-label': t('Start from current layout')} as React.InputHTMLAttributes<HTMLInputElement>}
            data-testid="grid-view-from-current"
          />
          <Box>
            <Box sx={{fontSize: 13, color: 'text.primary'}}>
              {t('Start from current layout')}
            </Box>
            <Box sx={{fontSize: 11, color: 'text.secondary', mt: 0.125}}>
              {t('Copies current columns, filters and sorting.')}
            </Box>
          </Box>
        </Stack>
      )}

      <Stack direction="row" spacing={0.75} justifyContent="flex-end">
        <Button
          onClick={onClose}
          size="small"
          sx={{color: 'text.secondary', fontSize: 13, textTransform: 'none'}}
        >
          {t('Cancel')}
        </Button>
        <Button
          onClick={submit}
          disabled={!canSubmit}
          variant="contained"
          size="small"
          startIcon={mode === 'create' ? <SaveOutlinedIcon /> : undefined}
          sx={{fontSize: 13, textTransform: 'none', px: 1.75}}
          data-testid="grid-view-name-submit"
        >
          {confirmLabel}
        </Button>
      </Stack>
    </Popover>
  );
};

export default GridViewNamePopover;
