import Grid from '@mui/material/Grid';
import React from 'react';
import { useMutation, useQuery } from '@connectrpc/connect-query';
import { get, updateAvatar } from '@gen/core/me/v1/me-MeService_connectquery';
import { UserDetailsForm } from '~/sections/me/user-details/user-details-form';
import Divider from '@mui/material/Divider';
import { toast } from 'react-hot-toast';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';
import LabelledValue from '~/components/labelled-value';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import Edit from '@mui/icons-material/Edit';
import AvatarInput from '~/components/avatar-input/avatar-input';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { UpdateAvatarRequest } from '@gen/core/me/v1/me_pb';

const UserDetails = () => {
  const { data, isLoading, refetch } = useQuery(get, {});

  const { mutateAsync: saveAvatar } = useMutation(updateAvatar);

  const onSubmitAvatar = async (data: string) => {
    try {
      await saveAvatar(new UpdateAvatarRequest({ base64img: data })).then(() => {
        refetch();
      });
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const [inEditMode, setInEditMode] = React.useState(false);

  return (
    <Card>
      <CardHeader
        action={
          <IconButton
            onClick={() => {
              setInEditMode(true);
            }}
            disabled={isLoading || inEditMode}
          >
            <SvgIcon>
              <Edit />
            </SvgIcon>
          </IconButton>
        }
        title="My Profile"
      />
      {!inEditMode && (
        <Stack direction={'row'} spacing={3} paddingX={3} paddingBottom={2}>
          <AvatarInput src={data?.avatar || ''} onSave={onSubmitAvatar} />
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant={'subtitle1'}>Information</Typography>
            <LabelledValue loading={isLoading} label="Name" value={data?.displayName} />
            <LabelledValue loading={isLoading} label="Username" value={data?.username} />
          </Box>
          <Box>
            <Typography variant={'subtitle1'}>Contact</Typography>
            <LabelledValue loading={isLoading} label="Email" value={data?.email} />
          </Box>
        </Stack>
      )}
      {inEditMode && (
        <Grid paddingBottom={2} paddingX={3}>
          <UserDetailsForm
            initialValues={{ displayName: data?.displayName }}
            onCancel={() => setInEditMode(false)}
            onSubmitSuccess={() => {
              refetch();
              setInEditMode(false);
            }}
          />
        </Grid>
      )}
    </Card>
  );
};

export default UserDetails;
