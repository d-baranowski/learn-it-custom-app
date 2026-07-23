import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import {Logo} from '~/components/logo';
import {RouterLink} from '~/components/router-link';
import {paths} from '~/paths';
import {GetServerSidePropsContext, InferGetServerSidePropsType,} from 'next/types';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from 'next/router';
import {toast} from 'react-hot-toast';
import verifyCfToken from '~/auth/verify-cf-token';
import {sessionBackend} from '~/server/connect/user';
import createSignedrpgToken from '~/auth/create-signed-rpg-token';
import getToken from '~/auth/get-token';
import trim from 'lodash/trim';
import {useTranslation} from 'next-i18next';
import {Link, Tab, Tabs} from '@mui/material';
import {withTranslations} from '~/utils/with-translations';
import {isValidCallbackUrl} from '~/utils/validate-callback-url';
import NextLink from 'next/link';

interface FormValues {
  account?: string;
  password: string;
  usingEmail: boolean;
}

interface SignInProps {
  usingEmail: false;
}

export default function SignIn({
  token,
  usingEmail,
}: InferGetServerSidePropsType<typeof getServerSideProps> & SignInProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { callbackUrl } = router.query;
  const [value, setValue] = React.useState(usingEmail ? 0 : 1);

  const [account, setAccount] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    setAccount('');
    setPassword('');
  };

// ...existing code...

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: FormValues = { account, password, usingEmail: value === 0 };

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        const trimmedCallbackUrl = trim((callbackUrl as string) || '');

        // Validate callback URL against available routes
        if (trimmedCallbackUrl && isValidCallbackUrl(trimmedCallbackUrl)) {
          router.push(trimmedCallbackUrl);
        } else {
          // Default to home screen if callback URL is invalid or empty
          router.push('/home-screen');
        }
      } else {
        toast.error(t('Failed to login'));
        setSubmitting(false);
      }
    } catch (error) {
      toast.error(t('Failed to login'));
      console.error('Error:', error);
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (!token) {
      return;
    }

    const trimmedCallbackUrl = trim((callbackUrl as string) || '');

    // Validate callback URL against available routes
    if (trimmedCallbackUrl && isValidCallbackUrl(trimmedCallbackUrl)) {
      router.push(trimmedCallbackUrl);
    } else {
      router.push('/home-screen');
    }
  }, [callbackUrl, router, token]);

  if (token) {
    return <></>;
  }

  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        display: 'flex',
        flex: '1 1 auto',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Box
        sx={{
          backgroundColor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          p: {
            xs: 4,
            md: 8,
          },
          width: {
            xs: '100%',
            md: 600,
          },
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <div>
          <Box sx={{ mb: 4 }}>
            <Stack
              alignItems="center"
              component={RouterLink}
              direction="row"
              display="inline-flex"
              href={paths.index()}
              spacing={1}
              sx={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  height: 24,
                  width: 24,
                }}
              >
                <Logo />
              </Box>
              <Box
                sx={{
                  color: 'text.primary',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.3px',
                  lineHeight: 2.5,
                  '& span': {
                    color: 'primary.main',
                  },
                }}
              >
                Utro
              </Box>
            </Stack>
          </Box>
          <>
            <Typography variant="h5">{t('Login')}</Typography>

            <form onSubmit={onSubmit}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="basic tabs example"
                  >
                    {usingEmail && <Tab label={t('Using Email')} />}
                    <Tab label={t('Using Username')} />
                  </Tabs>
                </Box>
              </Box>
              <TextField
                name="account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                label={value === 0 ? t('Email') : t('Username')}
                fullWidth
                margin="normal"
                inputProps={{ 'data-testid': 'account' }}
              />
              <TextField
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label={t('Password')}
                fullWidth
                margin="normal"
                type="password"
                inputProps={{ 'data-testid': 'password' }}
              />
              <Button
                data-testid={'login-btn'}
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
                disabled={submitting}
                endIcon={submitting ? <CircularProgress size={18} /> : undefined}
              >
                {t('Login')}
              </Button>
            </form>
            <Link
              component={NextLink}
              href={paths.devTools()}
              sx={{ display: 'block', mt: 2, fontSize: 12, color: 'text.disabled', textAlign: 'center' }}
            >
              Dev Tools
            </Link>
          </>
        </div>
      </Box>
    </Box>
  );
}

export const getServerSideProps = withTranslations(async (context: GetServerSidePropsContext) => {
  try {
    const cfToken: string | undefined = context.req.headers[
      'cf-access-jwt-assertion'
    ] as string;
    const token = await getToken({
      cookieString: context.req.headers.cookie,
    }).catch(() => null);

    if (!token && cfToken) {
      const cfTokenObj = await verifyCfToken(cfToken);
      if (cfTokenObj) {
        try {
          console.log('Creating session for user with email', cfTokenObj.email);
          const request = {
            email: cfTokenObj.email,
          };
          const session = await sessionBackend.createUserSession(request, {
            headers: {
              'x-user-id': 'rpg-nextjs',
              'x-session-id': 'rpg-nextjs',
            },
          });
          console.log('Session created successfully for user', cfTokenObj.email, session.id);
          const token = await createSignedrpgToken(session);
          context.res.setHeader(
            'Set-Cookie',
            `RPG_AUTH_TOKEN=${token}; Path=/; SameSite=Strict; Secure;`,
          );
          return {
            props: {
              token: token,
            },
          };
        } catch (e) {
          console.error('Failed to create session', e);
        }
      }
    }

    return {
      props: {
        token: token ?? '',
      },
    };
  } catch (e) {
    console.error('Failed to verify token', e);
    return {
      props: {
        token: '',
      },
    };
  }
});
