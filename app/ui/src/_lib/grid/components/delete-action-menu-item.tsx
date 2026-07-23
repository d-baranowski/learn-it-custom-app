import React from 'react';
import {Permission} from '@gen/permissions';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import {useMutation} from '@connectrpc/connect-query';
import {useConfirm} from 'material-ui-confirm';
import {useUserPermissions} from '~/providers/user-permissions';
import {toast} from 'react-hot-toast';
import {ConnectError} from '@connectrpc/connect';
import {InUseByEntityError} from '@gen/api/v1/error_pb';
import {capitalCase} from 'change-case';
import {MessageType, MethodKind, ScalarType} from '@bufbuild/protobuf';
import useSelectedRows from '~/_lib/grid/hooks/use-selected-rows';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';
import {useTranslation} from 'next-i18next';

const MAX_INLINE_LABELS = 3;

function rowLabel(row: Record<string, any> | undefined): string {
  if (!row) return '';
  if (row.lastName || row.firstName) {
    return [row.lastName, row.firstName].filter(Boolean).join(' ').trim();
  }
  const dn = row.displayName;
  if (dn && typeof dn === 'object') {
    if (dn.pl) return dn.pl;
    if (dn.en) return dn.en;
  }
  const labelKeys = [
    'label',
    'userLabel',
    'customerLabel',
    'therapistLabel',
    'therapyLabel',
    'serviceLabel',
    'roomLabel',
    'officeLabel',
    'name',
    'displayAbbreviation',
  ];
  for (const k of labelKeys) {
    if (typeof row[k] === 'string' && row[k]) return row[k];
  }
  return row.id ?? '';
}

export type deleteDescriptor = {
  localName: string;
  name: string;
  kind: MethodKind.Unary;
  I: MessageType;
  O: MessageType;
  service: {
    typeName: string;
  };
};

interface Props {
  permission: Permission;
  deleteDescriptor: deleteDescriptor;
  refetch: () => void;
  hideLabel?: boolean;
  sx?: import('@mui/material/styles').SxProps;
}

const DeleteActionMenuItem: React.FunctionComponent<Props> =
  function DeleteActionMenuItem(props) {
    const { t } = useTranslation('common');

    const { mutateAsync: deleteFn } = useMutation(props.deleteDescriptor);
    const confirm = useConfirm();
    const { canDelete, canSoftDelete } = useUserPermissions();

    const selectedRows = useSelectedRows();
    const { rows } = useGridSettings();

    if (
      !props.deleteDescriptor.I.fields.list().find((fo) => {
        // name: "IDs", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true

        if (fo.name !== 'IDs') {
          return false;
        }

        if (fo.kind !== 'scalar') {
          return false;
        }

        if (!fo.repeated) {
          return false;
        }

        if (fo.T !== ScalarType.STRING) {
          return false;
        }

        return true;
      })
    ) {
      console.error(
        'invalid delete descriptor argument IDs is not found',
        props.deleteDescriptor,
      );
      return <div></div>;
    }

    const handleDelete = async () => {
      if (selectedRows.count === 0) {
        toast.error(t('No rows selected'));
        return false;
      }

      const selectedIds = new Set(selectedRows.ids);
      const labels = (rows ?? [])
        .filter((r) => selectedIds.has(r.id))
        .map(rowLabel)
        .filter(Boolean);

      const description =
        labels.length > 0 && labels.length <= MAX_INLINE_LABELS && labels.length === selectedRows.count
          ? t('Delete the following rows: {{labels}}?', { labels: labels.join(', ') })
          : t('Delete {{count}} selected rows?', { count: selectedRows.count });

      const {confirmed} = await confirm({
        description,
      }).then(() => ({ confirmed: true }))
        .catch(() => ({ confirmed: false }));

      if (confirmed) {
        deleteFn({ IDs: selectedRows.ids })
          .then(() => {
            selectedRows.clear();
            toast.success(t(`Rows(s) deleted successfully`));
            window.setTimeout(() => {
              props.refetch();
            }, 100);
          })
          .catch((err) => {
            if (err instanceof ConnectError) {
              const errDetails = err.findDetails(InUseByEntityError);
              if (errDetails?.length > 0) {
                const d = errDetails[0];
                toast.error(
                  t(
                    'Cannot delete selected rows because some are used used by ',
                  ) + capitalCase(d.entityType as string),
                );
              } else {
                toast.error(err.message);
              }
            } else {
              toast.error(err.message);
            }
          });
      }

      return confirmed;
    };

    const isDisabled = (permission: Permission) => {
      switch (props.deleteDescriptor.name) {
        case 'Delete':
          return !canDelete(permission);
        case 'SoftDelete':
          return !canSoftDelete(permission);
        default:
          console.error('invalid delete descriptor', props.deleteDescriptor);
          return false;
      }
    };

    if (props.hideLabel) {
      return (
        <Tooltip arrow title={t('Delete selected')}>
          <IconButton
            disabled={isDisabled(props.permission)}
            onClick={handleDelete}
            sx={{
              ...props.sx,
              color: 'text.secondary',
              transition: 'color 0.2s ease',
              '&:hover': { color: 'error.main' },
            }}
            data-testid="delete-menu-item-icon"
            aria-label={t('Delete selected')}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      );
    }

    return (
      <MenuItem
        disabled={isDisabled(props.permission)}
        onClick={handleDelete}
        disableRipple
        data-testid="delete-menu-item"
      >
        <DeleteIcon />
        {t('Delete')}
      </MenuItem>
    );
  };

export default DeleteActionMenuItem;
