import {useGridRefetch} from '~/contexts/grid-refetch-context';
import {useTranslation} from 'next-i18next';
import {useConfirm} from 'material-ui-confirm';
import useOptionalMutation from '~/hooks/use-optional-mutation';
import toast from 'react-hot-toast';
import {Button} from '@mui/material';

interface Props {
  cell: any;
  method: any;
}

export const CellResetPasswordButton: React.FunctionComponent<Props> =
  function CellResetPasswordButton(props) {
    const { refetch } = useGridRefetch();
    const { t } = useTranslation('common');
    const confirm = useConfirm();
    const { mutateAsync: updateFn } = useOptionalMutation(props.method);
    const handleChangeStatus = (id : string ,employeeName : string) => {
      try {
        confirm({
          description: t(
            `${t("Are you sure you want to reset password for employee")} ${employeeName}?`,
          ),
          title: t('Confirm'),
          cancellationText: t('Cancel'),
        }).then(() => {
          const empReset = { id: id, password: "password" };
          toast
            .promise(
              updateFn(empReset),
              {
                loading: 'Loading',
                success: `${t('Updated')} ${t('Password')}`,
                error: `${t('Error when updating')} ${t('Password')}`,
              },
              { id: `update-password` },
            )
            .then(() => {
              refetch();
            });
        });
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    return (
      <>
        <Button
          color="success"
          onClick={() => handleChangeStatus(props.cell.row.original.id,props.cell.row.original.displayName)}
        >
          {t("Reset Password")}
        </Button>
      </>
    );
  };
