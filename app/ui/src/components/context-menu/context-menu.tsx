import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from "@mui/material/ListItemIcon";
import NestedMenuItem from "./nested-menu-item";
import {nanoid} from "nanoid";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";

export interface ContextMenuState<T extends any> {
  mouseX: number | null;
  mouseY: number | null;
  data?: T;
}

interface ContextMenuItem<T extends any> {
  label: string;
  icon?: React.ReactNode;
  onClick?: (data?: T) => void;
  children?: ContextMenuItems<T>;
  testId?: string;
}

export const Items = {
  DIVIDER: "divider"
} as const;


export type ContextMenuItemStrings = typeof Items[keyof typeof Items];
type ContextMenuItemUnion<T extends any> = ContextMenuItem<T> | ContextMenuItemStrings;
export type ContextMenuItems<T extends any> = ContextMenuItemUnion<T>[];

interface ContextMenuProps<T extends any> {
  contextMenu: ContextMenuState<T>;
  handleClose: () => void;
  menuItems: ContextMenuItems<T>;
}

const ContextMenu = <T extends any>({contextMenu, handleClose, menuItems}: ContextMenuProps<T>) => {

  const renderMenuItems = (menuItems: ContextMenuItems<T>, parentItem?: HTMLElement) => {
    return menuItems.map((item, index) => {
      if (typeof item === 'string') {
        if (item === Items.DIVIDER) {
          return <Divider key={nanoid()}/>
        }
      }

      const handleItemClick = (event: React.MouseEvent<HTMLElement>) => {
        if (item.onClick) {
          item.onClick(contextMenu.data);
          handleClose();
        }
      };

      if (item.children && item.children.length) {
        return (
          <NestedMenuItem key={nanoid()} onClick={handleItemClick} parentMenuOpen label={item.label}>
            {renderMenuItems(item.children)}
          </NestedMenuItem>
        )
      } else {
        return (
          <MenuItem key={nanoid()} onClick={handleItemClick} data-testid={item.testId}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        )
      }
    });
  };

  return (
    <Menu
      sx={{
        '& .MuiMenu-paper': {
          boxShadow: '3px 3px 3px 0px rgba(0,0,0,0.2)',
          borderRadius: '4px',
          padding: '2px',
        },
        '& .MuiList-padding': {
          p: 0
        },
        '& .MuiMenuItem-gutters': {
          padding: '4px 8px',
        },
        '& .MuiListItemIcon-root': {
          mr: '0px',
          '& .MuiSvgIcon-root': {
            //fontSize: '1.2rem',
          },
        },
        '& .MuiListItemText-primary': {
          //fontSize: '0.8rem',
        },
        '& .MuiDivider-root': {
          margin: '4px 0',
          borderColor: 'rgba(0,0,0,0.1)',
        },

      }}
      keepMounted
      open={contextMenu.mouseY !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu.mouseY !== null && contextMenu.mouseX !== null
          ? {top: contextMenu.mouseY, left: contextMenu.mouseX}
          : undefined
      }
    >
      {renderMenuItems(menuItems)}
    </Menu>
  );
};

export default ContextMenu;
