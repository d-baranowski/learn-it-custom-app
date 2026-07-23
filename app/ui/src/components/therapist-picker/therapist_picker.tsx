import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Avatar,
  AvatarGroup,
  Box,
  Checkbox,
  Chip,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@connectrpc/connect-query';
import { list as listTherapists } from '@gen/core/v1/therapist-TherapistService_connectquery';
import { Pagination, SelectRequest } from '@gen/request/v1/base_pb';
import { useSession } from '~/auth/session-provider';

interface TherapistPickerItem {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  specialization: string;
  userId?: string;
}

const FALLBACK_COLORS = [
  '#2E4057', '#5B7553', '#C17817', '#8B4513', '#3A7D44',
  '#6B4984', '#C75146', '#4A7B9D', '#8B6914', '#2F6B5E',
];

function fallbackColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return (words[0]?.[0] ?? '?').toUpperCase();
}

function getLocalizedString(
  obj: { en?: string; pl?: string } | undefined,
  lang: string
): string {
  if (!obj) return '';
  return (obj as Record<string, string>)[lang] || obj.en || obj.pl || '';
}

const ALL_THERAPISTS_REQUEST = new SelectRequest({
  pagination: new Pagination({ take: 200 }),
});

interface TherapistPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  multiselect?: boolean;
  autoSelectSelf?: boolean;
  label?: string;
  placeholder?: string;
  dataTestId?: string;
}

export const TherapistPicker: React.FC<TherapistPickerProps> = ({
  selectedIds,
  onChange,
  multiselect = true,
  autoSelectSelf = false,
  label,
  placeholder,
  dataTestId = 'therapist-filter-trigger',
}) => {
  const { t, i18n } = useTranslation();
  const { session } = useSession();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');

  const { data } = useQuery(listTherapists, ALL_THERAPISTS_REQUEST);

  const therapists = useMemo<TherapistPickerItem[]>(() => {
    if (!data?.items) return [];
    return data.items.map((th) => ({
      id: th.id,
      name: th.userLabel || th.id,
      abbreviation: th.userAbbreviationLabel || getInitials(th.userLabel || th.id),
      color: th.displayColor || fallbackColor(th.id),
      specialization: getLocalizedString(th.professionalTitle, i18n.language),
      userId: th.userId,
    }));
  }, [data, i18n.language]);

  const myTherapist = useMemo(
    () => therapists.find((th) => th.userId && th.userId === session?.userId),
    [therapists, session?.userId]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return therapists;
    const q = search.toLowerCase();
    return therapists.filter(
      (th) =>
        th.name.toLowerCase().includes(q) ||
        th.specialization.toLowerCase().includes(q)
    );
  }, [therapists, search]);

  const [localIds, setLocalIds] = useState(selectedIds);
  const [, startTransition] = useTransition();
  const localIdsRef = useRef(localIds);
  localIdsRef.current = localIds;

  useEffect(() => {
    if (JSON.stringify(selectedIds) !== JSON.stringify(localIdsRef.current)) {
      setLocalIds(selectedIds);
    }
  }, [selectedIds]);

  const selected = useMemo(() => new Set(localIds), [localIds]);

  const applySelection = (nextIds: string[]) => {
    setLocalIds(nextIds);
    startTransition(() => {
      onChange(nextIds);
    });
  };

  const didAutoSelectRef = useRef(false);
  useEffect(() => {
    if (!autoSelectSelf || didAutoSelectRef.current) return;
    if (selectedIds.length > 0) {
      didAutoSelectRef.current = true;
      return;
    }
    if (myTherapist) {
      didAutoSelectRef.current = true;
      applySelection([myTherapist.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSelectSelf, selectedIds, myTherapist]);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => {
    setAnchorEl(null);
    setSearch('');
  };

  const toggle = (id: string) => {
    if (!multiselect) {
      applySelection([id]);
      handleClose();
      return;
    }
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    applySelection(Array.from(next));
  };

  const selectJustMe = () => {
    if (!myTherapist) return;
    applySelection([myTherapist.id]);
    if (!multiselect) handleClose();
  };

  const selectedTherapists = therapists.filter((th) => selected.has(th.id));
  const captionLabel = label ?? (multiselect ? t('Therapists') : t('Therapist'));
  const emptyLabel = placeholder ?? (multiselect ? t('All therapists') : t('Select therapist'));

  const tooltipTitle = selectedTherapists.length === 0
    ? emptyLabel
    : selectedTherapists.map((th) => th.name).join('\n');

  const valueLabel = selectedTherapists.length === 0
    ? emptyLabel
    : multiselect
      ? `${selectedTherapists.length} ${t('of')} ${therapists.length}`
      : selectedTherapists[0].name;

  return (
    <>
      <Tooltip
        title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipTitle}</span>}
        arrow
        placement="top"
        enterDelay={400}
        disableHoverListener={!multiselect || Boolean(anchorEl)}
      >
      <Box
        data-testid={dataTestId}
        onClick={handleOpen}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: '#F6F4EE',
          borderRadius: '6px',
          px: 1.5,
          pt: '5px',
          pb: '5px',
          height: '48px',
          boxSizing: 'border-box',
          cursor: 'pointer',
          flex: 1,
          minWidth: 0,
          '&:hover': { backgroundColor: '#F0EEE3' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: '#5F5E5A', fontSize: '0.65rem', lineHeight: 1, display: 'block' }}
          >
            {captionLabel}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
            {selectedTherapists.length > 0 && (
              <AvatarGroup
                max={multiselect ? 3 : 1}
                sx={{
                  '& .MuiAvatar-root': {
                    width: 20,
                    height: 20,
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    border: '2px solid #F6F4EE',
                  },
                }}
              >
                {selectedTherapists.map((th) => (
                  <Avatar key={th.id} sx={{ bgcolor: th.color }}>
                    {th.abbreviation}
                  </Avatar>
                ))}
              </AvatarGroup>
            )}
            <Typography
              variant="body2"
              sx={{
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.85rem',
              }}
            >
              {valueLabel}
            </Typography>
          </Box>
        </Box>
        <KeyboardArrowDownIcon sx={{ fontSize: 18, color: '#5F5E5A', flexShrink: 0 }} />
      </Box>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          root: {
            sx: {
              '& .MuiBackdrop-root': {
                backgroundColor: 'transparent',
                backdropFilter: 'none',
              },
            },
          },
          paper: {
            sx: {
              mt: 1,
              borderRadius: 1.5,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              width: 340,
              maxHeight: 480,
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            label={t('Search therapists...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: '#999' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                backgroundColor: '#f8f8f6',
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5 }}>
            {myTherapist && (
              <Chip
                icon={<PersonOutlineIcon sx={{ fontSize: '16px !important' }} />}
                label={t('Just me')}
                size="small"
                variant={
                  localIds.length === 1 && localIds[0] === myTherapist.id
                    ? 'filled'
                    : 'outlined'
                }
                onClick={selectJustMe}
                sx={{ fontWeight: 500 }}
              />
            )}
            {multiselect && (
              <Chip
                label={t('Select all')}
                size="small"
                variant={
                  localIds.length === therapists.length ? 'filled' : 'outlined'
                }
                onClick={() => applySelection(therapists.map((th) => th.id))}
                sx={{ fontWeight: 500 }}
              />
            )}
            <Chip
              label={t('Clear')}
              size="small"
              variant="outlined"
              onClick={() => applySelection([])}
              sx={{ fontWeight: 500 }}
            />
          </Box>
        </Box>

        <List sx={{ overflow: 'auto', py: 0.5 }}>
          {filtered.map((th) => {
            const isSelected = selected.has(th.id);
            const isMe = myTherapist?.id === th.id;
            return (
              <ListItemButton
                key={th.id}
                onClick={() => toggle(th.id)}
                selected={!multiselect && isSelected}
                dense
                sx={{ py: 0.75, px: 2 }}
              >
                {multiselect && (
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      checked={isSelected}
                      tabIndex={-1}
                      disableRipple
                      size="small"
                    />
                  </ListItemIcon>
                )}
                <Avatar
                  sx={{
                    bgcolor: th.color,
                    width: 32,
                    height: 32,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    mr: 1.5,
                    flexShrink: 0,
                  }}
                >
                  {th.abbreviation}
                </Avatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {th.name}
                      </Typography>
                      {isMe && (
                        <Chip
                          label={t('YOU')}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: '#E8E5F0',
                            color: '#5C4B8A',
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={th.specialization}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    noWrap: true,
                    sx: { color: '#888' },
                  }}
                />
                {!multiselect && isSelected && (
                  <CheckIcon sx={{ fontSize: 20, color: 'primary.main', ml: 1 }} />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Popover>
    </>
  );
};
