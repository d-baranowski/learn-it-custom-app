/**
 * FormActionsDropdown — "⋮" actions menu for entity forms.
 *
 * Renders in the dialog header (next to title) via Dialog2HeaderActionsContext.
 * Provides a standard set of actions (Refresh, Delete, plus optional extras
 * like Cancel Session). Each action is disabled when the user lacks permission.
 *
 * Usage:
 *   <FormActionsDropdown
 *     permission={Permissions.Session}
 *     deleteDescriptor={deleteSession}
 *     entityId={id}
 *     onDeleteSuccess={onCancel}
 *   >
 *     <MenuItem onClick={handleCancel}>Cancel Session</MenuItem>
 *   </FormActionsDropdown>
 */

import React from 'react';
import {
  CircularProgress,
  Divider,
  IconButton,
  ListItemText,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useHotkeys } from 'react-hotkeys-hook';
import { useMutation } from '@connectrpc/connect-query';
import { useConfirm } from 'material-ui-confirm';
import { useTranslation } from 'next-i18next';
import { toast } from 'react-hot-toast';
import { ConnectError } from '@connectrpc/connect';
import { InUseByEntityError } from '@gen/api/v1/error_pb';
import { capitalCase } from 'change-case';
import type { Permission } from '@gen/permissions';

import StyledMenu from '~/components/styled-menu';
import { useUserPermissions } from '~/providers/user-permissions';
import { useDialogHeaderActions } from '~/components/dialog/dialog2-header-actions-context';
import { useOptionalFormRefresh } from '~/_lib/forms/runtime/form-context';

export interface DeleteDescriptor {
  localName: string;
  name: string;
  kind: number;
  I: any;
  O: any;
  service: { typeName: string };
}

export interface FormActionsDropdownProps {
  /** Permission subject for the entity. */
  permission: Permission;
  /** Connect-query delete method descriptor (e.g. `delete$`). */
  deleteDescriptor?: DeleteDescriptor;
  /** ID of the entity being edited. Null / undefined for create-mode forms. */
  entityId?: string | null;
  /** Called after a successful delete — typically closes the form. */
  onDeleteSuccess?: () => void;
  /** Extra MenuItems rendered before the delete action. */
  children?: React.ReactNode;
}

export const FormActionsDropdown: React.FC<FormActionsDropdownProps> = ({
  permission,
  deleteDescriptor,
  entityId,
  onDeleteSuccess,
  children,
}) => {
  const { t } = useTranslation();
  const { canDelete, canSoftDelete } = useUserPermissions();
  const confirm = useConfirm();
  const { refresh, canRefresh, isRefreshing } = useOptionalFormRefresh();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { mutateAsync: deleteFn } = useMutation(
    deleteDescriptor ?? ({} as any),
  );

  const isEditMode = !!entityId;

  const isDeleteDisabled = React.useMemo(() => {
    if (!deleteDescriptor || !isEditMode) return true;
    if (deleteDescriptor.name === 'SoftDelete') return !canSoftDelete(permission);
    return !canDelete(permission);
  }, [deleteDescriptor, isEditMode, permission, canDelete, canSoftDelete]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = async () => {
    handleClose();
    if (refresh) {
      await refresh();
      return;
    }

    // Only forms with a scoped refresh should use this shared menu. A global
    // invalidation here refetches unrelated grids/dialogs and makes Refresh
    // appear to target the wrong screen.
    console.warn('FormActionsDropdown refresh skipped: no form refresh context');
  };

  const handleDelete = async () => {
    handleClose();
    if (!entityId || !deleteDescriptor) return;

    try {
      await confirm({
        description: t('Are you sure you want to delete this item?'),
      });
    } catch {
      return; // user cancelled
    }

    try {
      await deleteFn({ IDs: [entityId] });
      toast.success(t('Item deleted successfully'));
      onDeleteSuccess?.();
    } catch (err) {
      if (err instanceof ConnectError) {
        const errDetails = err.findDetails(InUseByEntityError);
        if (errDetails?.length > 0) {
          toast.error(
            t('Cannot delete because it is used by {{entity}}', {
              entity: capitalCase(errDetails[0].entityType as string),
            }),
          );
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error(String((err as Error)?.message ?? err));
      }
    }
  };

  // Wrap extra children so clicking any MenuItem closes the menu.
  const wrapChild = (child: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(child)) return child;
    if (child.type === React.Fragment) {
      return React.Children.map(child.props.children, wrapChild);
    }
    const original = (child as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props.onClick;
    return React.cloneElement(child as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
      onClick: (e: React.MouseEvent) => {
        handleClose();
        original?.(e);
      },
    });
  };
  const wrappedChildren = React.Children.map(children, wrapChild);

  useHotkeys('mod+shift+r', (e) => {
    e.preventDefault();
    if (canRefresh) handleRefresh();
  }, { enableOnFormTags: true }, [canRefresh, handleRefresh]);

  useHotkeys('delete', (e) => {
    if (deleteDescriptor && !isDeleteDisabled && entityId) {
      e.preventDefault();
      handleDelete();
    }
  }, { enableOnFormTags: false }, [deleteDescriptor, isDeleteDisabled, entityId, handleDelete]);

  const dropdownNode = React.useMemo(
    () => (
      <FormActionsDropdownInner
        anchorEl={anchorEl}
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        onRefresh={handleRefresh}
        isRefreshDisabled={!canRefresh}
        isRefreshing={isRefreshing}
        onDelete={deleteDescriptor ? handleDelete : undefined}
        isDeleteDisabled={isDeleteDisabled}
        wrappedChildren={wrappedChildren}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [anchorEl, open, isDeleteDisabled, isRefreshing, wrappedChildren, deleteDescriptor, entityId],
  );

  useDialogHeaderActions(dropdownNode);

  // Render nothing inline — the component renders in the header via context.
  return null;
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
const modLabel = isMac ? '⌘' : 'Ctrl+';

/** Inner presentational component — avoids re-creating the node identity on every render. */
const FormActionsDropdownInner: React.FC<{
  anchorEl: HTMLElement | null;
  open: boolean;
  onOpen: (e: React.MouseEvent<HTMLElement>) => void;
  onClose: () => void;
  onRefresh: () => void;
  onDelete?: () => void;
  isRefreshDisabled: boolean;
  isRefreshing: boolean;
  isDeleteDisabled: boolean;
  wrappedChildren?: React.ReactNode;
}> = ({ anchorEl, open, onOpen, onClose, onRefresh, onDelete, isRefreshDisabled, isRefreshing, isDeleteDisabled, wrappedChildren }) => {
  const { t } = useTranslation();

  return (
    <>
      {isRefreshing && (
        <CircularProgress size={14} thickness={5} sx={{ color: 'text.disabled' }} />
      )}
      <Tooltip title={t('Actions')}>
        <IconButton
          data-testid="form-actions-dropdown-btn"
          onClick={onOpen}
          size="small"
          sx={{ color: 'text.secondary', p: 0.5, '&:hover': { color: 'text.primary' } }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <StyledMenu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
      >
        <MenuItem data-testid="form-refresh-action" onClick={onRefresh} disabled={isRefreshDisabled} sx={{ py: 0.75, gap: 0.75 }}>
          <RefreshIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0 }} />
          <ListItemText primaryTypographyProps={{ fontSize: 13 }}>{t('Refresh')}</ListItemText>
          <Typography variant="caption" sx={{ color: 'text.disabled', ml: 3, fontSize: 11 }}>{modLabel}⇧R</Typography>
        </MenuItem>
        {wrappedChildren}
        {onDelete && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              data-testid="form-delete-action"
              disabled={isDeleteDisabled}
              onClick={onDelete}
              sx={{
                py: 0.75,
                gap: 0.75,
                color: isDeleteDisabled ? 'text.disabled' : '#c04040',
                '&:hover': { backgroundColor: isDeleteDisabled ? undefined : 'rgba(192, 64, 64, 0.06)' },
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 16, color: isDeleteDisabled ? 'text.disabled' : '#c04040', mr: 0 }} />
              <ListItemText primaryTypographyProps={{ fontSize: 13 }}>{t('Delete')}</ListItemText>
              <Typography variant="caption" sx={{ color: 'text.disabled', ml: 3, fontSize: 11 }}>Del</Typography>
            </MenuItem>
          </>
        )}
      </StyledMenu>
    </>
  );
};
