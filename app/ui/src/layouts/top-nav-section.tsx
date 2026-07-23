import type {FC, ReactNode} from 'react';
import Stack from '@mui/material/Stack';
import {TopNavItem} from './top-nav-item';
import {useTranslation} from 'next-i18next';
import {Permission} from "@gen/permissions";

interface Item {
  disabled?: boolean;
  external?: boolean;
  icon?: ReactNode;
  items?: Item[];
  label?: ReactNode;
  path?: string;
  title: string;
  subject?: Permission;
}

interface TopNavSectionProps {
  canAccess?: (subject: Permission) => boolean;
  items?: Item[];
  pathname?: string | null;
  subheader?: string;
}

export const TopNavSection: FC<TopNavSectionProps> = (props) => {
  const { t } = useTranslation('common');

  const { canAccess, items = [], pathname } = props;

  return (
    <Stack
      component="ul"
      direction="row"
      spacing={1}
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
      }}
    >
      {items.map((item) => {
        const checkPath = !!(item.path && pathname);
        //const partialMatch = checkPath ? pathname.includes(item.path!) : false;
        const partialMatch = checkPath
          ? pathname?.startsWith(item.path!)
          : false;
        const exactMatch = checkPath ? pathname === item.path : false;

        // Branch

        if (item.items) {
          return (
            <TopNavItem
              active={partialMatch}
              disabled={item.disabled}
              icon={item.icon}
              items={item.items}
              key={item.title}
              label={item.label}
              title={t(item.title)}
              subject={item.subject}
              canAccess={canAccess}
            />
          );
        }

        // Leaf

        return (
          <TopNavItem
            active={exactMatch}
            disabled={item.disabled}
            external={item.external}
            icon={item.icon}
            key={item.title}
            label={item.label}
            path={item.path}
            title={t(item.title)}
            subject={item.subject}
            canAccess={canAccess}
          />
        );
      })}
    </Stack>
  );
};
