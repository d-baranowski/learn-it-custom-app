import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import {Logo} from '~/components/logo';
import {RouterLink} from '~/components/router-link';
import {paths} from '~/paths';
import {InferGetServerSidePropsType, GetServerSidePropsContext} from 'next/types';
import Button from '@mui/material/Button';
import {useRouter} from 'next/router';
import {authBackend} from '~/server/connect/user';
import getToken from '~/auth/get-token';
import {useTranslation} from 'next-i18next';
import {withTranslations} from '~/utils/with-translations';

export default function SignIn({}: InferGetServerSidePropsType<
  typeof getServerSideProps
>) {
  const { t } = useTranslation('common');
  const router = useRouter();

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
                {t('You are signed out')}
              </Box>
            </Stack>
          </Box>
          <>
            <Button
              onClick={() => router.push('/auth/signin')}
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              data-testid="login-button"
            >
              {t('Login')}
            </Button>
          </>
        </div>
      </Box>
    </Box>
  );
}

export const getServerSideProps = withTranslations(async (context: GetServerSidePropsContext) => {
  const token = await getToken({
    cookieString: context.req.headers.cookie,
  }).catch(() => null);

  await authBackend.logout(
    {},
    {
      headers: {
        // header values can't be undefined
        'x-user-id': token?.userId || '',
        'x-session-id': token?.sessionId || '',
        'X-User-ID': token?.userId || '',
        'X-Session-ID': token?.sessionId || '',
      },
    },
  );

  context.res.setHeader(
    'Set-Cookie',
    `RPG_AUTH_TOKEN=; Path=/; SameSite=Strict; Secure;`,
  );

  const proto = context.req.headers['x-forwarded-proto'];
  const host = context.req.headers['x-forwarded-host'];

  const logoutUrl = `${proto}://${host}/cdn-cgi/access/logout`;
  const cfToken: string | undefined = context.req.headers[
    'cf-access-jwt-assertion'
  ] as string;

  if (cfToken) {
    context.res.writeHead(307, { Location: logoutUrl });
    context.res.end();
    return {
      props: {},
    };
  }

  return {
    props: {},
  };
});
