import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Box, Button, Container, Paper, TextField, Typography} from '@mui/material';
import {updateUserPassword} from '@gen/core/v1/user-UserService_connectquery';
import {useMutation} from '@connectrpc/connect-query';
import {ResetUserPasswordRequest} from '@gen/core/v1/user_pb';
import {useSession} from '~/auth/session-provider';
import {useTranslation} from 'next-i18next';
import {withTranslations} from '~/utils/with-translations';

interface ChangePasswordProps {
}

const ChangePassword: React.FC<ChangePasswordProps> = () => {
  const {t} = useTranslation('common');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { mutateAsync: resetFn } = useMutation(updateUserPassword);
  const router = useRouter();
  const {session} = useSession();
  const [userId, setUserId] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

   // Password validation
   if (newPassword.length < 8) {
    setError(t('Password must be at least 8 characters long'));
    return;
  }
  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
    setError(t('Password must contain both uppercase and lowercase letters'));
    return;
  }
  if (!/[0-9]/.test(newPassword)) {
    setError(t('Password must contain at least one number'));
    return;
  }
  if (!/[!@#$%^&*]/.test(newPassword)) {
    setError(t('Password must contain at least one special character (e.g., !@#$%^&*)'));
    return;
  }
  if (/\s/.test(newPassword)) {
    setError(t('Password cannot contain spaces'));
    return;
  }
  if (currentPassword === newPassword) {
    setError(t('New password must be different from the current password'));
    return;
  }
  if (newPassword !== confirmPassword) {
    setError(t('New passwords do not match'));
    return;
  }


    const data: Partial<ResetUserPasswordRequest> = {
      id: userId,
      password: newPassword
    };

    try {
      await resetFn(data);
      setSuccess(t('Password updated successfully!'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Redirect to the login page after password change
      router.push('/auth/signin')
    } catch (err) {
      setError(t('Failed to reset password. Please try again.'));
    }
  };

  useEffect(() => {
    if (!session) {
      return;
    }
    setUserId(session.userId)
  }, [session]);
  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} style={{ padding: '20px', marginTop: '50px' }}>
        <Typography component="h1" variant="h5" align="center">
          {t("Change Password")}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label={t("Current Password")}
            type="password"
            id="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label={t("New Password")}
            type="password"
            id="newPassword"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label={t("Confirm New Password")}
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {success && (
            <Typography color="primary" variant="body2">
              {success}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            {t("Change Password")}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export const getServerSideProps = withTranslations();

export default ChangePassword;
