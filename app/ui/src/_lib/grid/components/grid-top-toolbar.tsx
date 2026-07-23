'use client'

import React, {FC, ReactNode} from "react";
import Stack from "@mui/material/Stack";
import BreadcrumbsRenderer from "~/components/breadcrumb/breadcrumb-renderer";
import Button from "@mui/material/Button";
import SvgIcon from "@mui/material/SvgIcon";
import FilterSidebarToggleBtn from "~/_lib/grid/components/filter-sidebar-toggle-btn";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";

const GridViewPill = dynamic(() => import('../view/grid-view-pill'), {
  loading: () => <p>Loading...</p>, ssr: false
})

interface GridSidebarButtonProps {
  icon?: ReactNode;
  label?: string;
  onClick?: () => void;
}

interface GridTopToolbarProps {
  breadcrumb?: boolean;
  viewToolbar?: boolean;
  sidebarButton?: GridSidebarButtonProps;
  children?: ReactNode;
}

const GridTopToolbar: FC<GridTopToolbarProps> = (props) => {
  const {
    breadcrumb = true,
    viewToolbar = true,
    sidebarButton,
    children,
  } = props;

  const defaultSidebarButton = {
    icon: <FilterSidebarToggleBtn/>,
    label: "Filters",
  } as GridSidebarButtonProps;

  const mergedSidebarButton = {
    ...defaultSidebarButton,
    ...sidebarButton,
  };

  return (
    <Stack spacing={2} sx={{marginBottom: 1}}>
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={3}
      >
        {breadcrumb && <BreadcrumbsRenderer/> || <Box></Box>}
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
        >
          {viewToolbar && <GridViewPill/>}
          {mergedSidebarButton.onClick && (
            <Button
              color="inherit"
              data-testid={"grid-filter-sidebar-toggle"}
              startIcon={
                <SvgIcon>
                  {mergedSidebarButton.icon}
                </SvgIcon>
              }
              onClick={mergedSidebarButton.onClick}
            >
              {mergedSidebarButton.label}
            </Button>
          )}
          {children}
        </Stack>
      </Stack>
    </Stack>
  );
}

export default GridTopToolbar;
