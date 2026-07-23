import React from 'react';
import {List, ListSubheader} from '@mui/material';
import {Item, Section} from './config';
import {SideNavItem} from './side-nav-item';
import {Permission} from '@gen/permissions';

interface SideNavSectionProps {
  canAccess?: (subject: Permission) => boolean;
  items?: Item[];
  pathname?: string | null;
  subheader?: string;
  section: Section;
  isDrawerExpanded: boolean;
  hideChildren: boolean;
}

export const SideNavSection: React.FC<SideNavSectionProps> = ({ 
  section, 
  canAccess = () => true, 
  isDrawerExpanded, 
  hideChildren
}) => {
  return (
    <React.Fragment>
      {section.items && section.items.length > 0 && (
        <List
          component="div"
          disablePadding
          data-testid={section?.subheader && `side-nav-section-${section.subheader.toLowerCase().replace(/\s+/g, '-')}`}
          sx={{ paddingY: 0 }}
          subheader={
            section.subheader && isDrawerExpanded ? (
              <ListSubheader
                component="div"
                sx={{
                  backgroundColor: 'transparent',
                  color: 'text.primary',
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 2.5,
                  paddingLeft: 2,
                  textTransform: 'uppercase',
                }}
              >
                {section.subheader}
              </ListSubheader>
            ) : undefined
          }
        >
          {section.items.map((item) => (
            <SideNavItem
              key={item.title}
              item={item}
              canAccess={canAccess}
              isDrawerExpanded={isDrawerExpanded}
              hideChildren={hideChildren}
            />
          ))}
        </List>
      )}
    </React.Fragment>
  );
};
