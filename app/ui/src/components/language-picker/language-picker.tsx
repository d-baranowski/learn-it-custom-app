import type {FC} from 'react';
import {useCallback, useState} from 'react';
import {useRouter} from 'next/router';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import LanguageIcon from '@mui/icons-material/Language';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CheckIcon from '@mui/icons-material/Check';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'pl', label: 'Polski' },
];

export const LanguagePicker: FC = () => {
  const router = useRouter();
  const { locale, locales, pathname, query, asPath } = router;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleChangeLanguage = useCallback((newLocale: string) => {
    // Set NEXT_LOCALE cookie to persist language preference (used by proxy)
    const maxAge = 60 * 60 * 24 * 365; // 1 year in seconds
    document.cookie = `NEXT_LOCALE=${newLocale};max-age=${maxAge};path=/`;
    router.push({ pathname, query }, asPath, { locale: newLocale });
    handleClose();
  }, [router, pathname, query, asPath, handleClose]);

  return (
    <>
      <Tooltip title="Change Language">
        <IconButton
          onClick={handleOpen}
          color="inherit"
          aria-controls={open ? 'language-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          data-testid="language-picker-btn"
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleChangeLanguage(language.code)}
            selected={locale === language.code}
            data-testid={`language-picker-item-${language.code}`}
          >
            <ListItemIcon>
              {locale === language.code && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{language.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
