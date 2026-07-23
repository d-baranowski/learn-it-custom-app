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

export const CellUpdateStatusButton: React.FunctionComponent<Props> =
  function CellUpdateStatusButton(props) {
    const { refetch } = useGridRefetch();
    const { t } = useTranslation('common');
    const confirm = useConfirm();
    const { mutateAsync: updateFn } = useOptionalMutation(props.method);
    const handleChangeStatus = (
      cell: { row: { original: any } },
      status: number,
    ) => {
      try {
        confirm({
          description: t(
            `Are you sure you want to ${status == 1 ? 'accept' : 'reject'} this request?`,
          ),
          title: t('Confirm'),
          cancellationText: t('Cancel'),
        }).then(() => {
          const updatedData = { ...cell.row.original, status: status };
          toast
            .promise(
              updateFn(updatedData),
              {
                loading: 'Loading',
                success: `${t('Updated')} ${t('Request')}`,
                error: `${t('Error when updating')} ${t('Request')}`,
              },
              { id: `update-request` },
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
          disabled={props.cell.row.original.status == 1}
          onClick={() => handleChangeStatus(props.cell, 1)}
        >
          {t("Approve")}
        </Button>
        <Button
          color="error"
          disabled={props.cell.row.original.status == 2}
          onClick={() => handleChangeStatus(props.cell, 2)}
        >
          {t("Reject")}
        </Button>
      </>
    );
  };
