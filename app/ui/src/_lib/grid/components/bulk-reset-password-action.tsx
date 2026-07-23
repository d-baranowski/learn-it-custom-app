import React from 'react';
import {Permission} from '@gen/permissions';
import {MethodUnaryDescriptor, useMutation} from '@connectrpc/connect-query';
import {useConfirm} from 'material-ui-confirm';
import {useUserPermissions} from '~/providers/user-permissions';
import {toast} from 'react-hot-toast';
import {ConnectError} from '@connectrpc/connect';
import {InUseByEntityError} from '@gen/api/v1/error_pb';
import {capitalCase} from 'change-case';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import useSelectedRows from '~/_lib/grid/hooks/use-selected-rows';
import {useTranslation} from 'next-i18next';
import {MenuItem} from '@mui/material';
import {useGridRefetch} from '~/contexts/grid-refetch-context';

interface Props {
  permission: Permission;
  method: MethodUnaryDescriptor<any, any>;
}

const BulkResetPassWordAction: React.FunctionComponent<Props> =
  function BulkResetPassWordAction(props) {
    const { permission, method } = props;
    const { refetch } = useGridRefetch();
    const { t } = useTranslation('common');

    const { mutateAsync: customFn } = useMutation(method);
    const confirm = useConfirm();
    const { canUpdate } = useUserPermissions();

    const selectedRows = useSelectedRows();
    const handleCustom = (status: number) => {
      if (selectedRows.count === 0) {
        toast.error(t('No rows selected'));
        return;
      }

      confirm({
        description: t(
          `Are you sure you want to reset password for selected user(s)?`,
        ),
      }).then(() => {
        customFn({ IDs: selectedRows.ids, status: status })
          .then(() => {
            selectedRows.clear();
            toast.success(t(`Request(s) updated successfully`));
            window.setTimeout(() => {
              refetch();
            }, 100);
          })
          .catch((err) => {
            if (err instanceof ConnectError) {
              const errDetails = err.findDetails(InUseByEntityError);
              if (errDetails?.length > 0) {
                const d = errDetails[0];
                toast.error(
                  t(
                    'Cannot update selected rows because some are used by ',
                  ) + capitalCase(d.entityType as string),
                );
              } else {
                toast.error(err.message);
              }
            } else {
              toast.error(err.message);
            }
          });
      });

      return true;
    };

    const isDisabled = (permission: Permission) => {
      return !canUpdate(permission);
    };

    return (
      <>
        <MenuItem
          disabled={isDisabled(permission)}
          onClick={() => handleCustom(1)}
          disableRipple
        >
          <RestartAltIcon />
          {t('Reset Password')}
        </MenuItem>
      </>
    );
  };

export default BulkResetPassWordAction;
