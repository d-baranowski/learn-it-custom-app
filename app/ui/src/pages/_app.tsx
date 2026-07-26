import type { AppContext, AppInitialProps, AppProps } from 'next/app';
import App from 'next/app';
import CssBaseline from '@mui/material/CssBaseline';
import Head from 'next/head';
import type { EmotionCache } from '@emotion/react';
import { CacheProvider } from '@emotion/react';
import { UserPermissionsProvider } from '~/providers/user-permissions';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ConfirmProvider } from 'material-ui-confirm';
import { createEmotionCache } from '~/utils/emotion-cache';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useRouter } from 'next/router';
import { getDateFnsLocale } from '~/utils/locale';
import { Toaster } from '~/components/toaster';
import { useNprogress } from '~/hooks/use-nprogress';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectTransport } from '~/utils/connect';
import { TransportProvider } from '@connectrpc/connect-query';
import { BreadcrumbsProvider } from '~/providers/breadcrumbs';
import { DevToolsProvider } from '~/providers/dev-tools';
import { Provider as ReactReduxProvider } from 'react-redux';

import React, { useState } from 'react';
import ThemeProvider from '~/providers/theme';

import '~/global.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-calendar/dist/Calendar.css';
import SessionProvider from '~/auth/session-provider';
import getToken from '~/auth/get-token';
import { JWT } from '~/auth/types';
import Favicon from '~/components/favicon';
import initialiseWasmValidators from '~/validation/initialise-wasm-validators';
import { wrapper } from '~/_lib/grid/state/store';
import { config } from '~/config';
import { appWithTranslation, useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';

const RpgWindowManager = dynamic(
  () => import('~/components/rpg-window-manager/rpg-window-manager'),
  { ssr: false }
);
import { FormRegistryProvider } from '~/providers/form-registry';
import FormRegistryInitializer from '~/components/rpg-window-manager/form-registry-initializer';
import { initTelemetry } from '~/_lib/telemetry/telemetry';

const clientSideEmotionCache = createEmotionCache();

const I18nConfirmProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation('common');
  return (
    <ConfirmProvider
      defaultOptions={{
        title: t('Are you sure?'),
        confirmationText: t('OK'),
        cancellationText: t('Cancel'),
        dialogProps: {
          'data-testid': 'confirm-dialog',
        } as any,
        confirmationButtonProps: {
          'data-testid': 'confirm-dialog-confirm-button',
        } as any,
        cancellationButtonProps: {
          'data-testid': 'confirm-dialog-cancel-button',
        } as any,
      }}
    >
      {children}
    </ConfirmProvider>
  );
};

export interface CustomAppProps extends AppProps {
  Component: any;
  emotionCache?: EmotionCache;
  token: JWT | null | undefined;
}

const CustomApp = ({
  Component,
  emotionCache = clientSideEmotionCache,
  ...rest
}: CustomAppProps) => {
  const { store, props } = wrapper.useWrappedStore(rest);
  const pageProps = props.pageProps;
  const router = useRouter();
  const dateFnsLocale = getDateFnsLocale(router.locale);

  useNprogress();

  const getLayout = Component.getLayout ?? ((page: any) => page);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 60 * 1000,
          },
        },
      })
  );

  React.useEffect(() => {
    console.log('initialiseWasmValidators()');
    initialiseWasmValidators();
    initTelemetry();
  }, []);

  return (
    <ReactReduxProvider store={store}>
      {/*
        devToolsEnabled is injected into every page's props by
        withTranslations(), because it can only be resolved server-side —
        see ~/providers/dev-tools for why config.ENABLE_DEV_TOOLS cannot be
        read directly from a client component.
      */}
      <DevToolsProvider enabled={props.pageProps?.devToolsEnabled === true}>
      <CacheProvider value={emotionCache}>
        <Head>
          <title>{config.BRAND_TEXT}</title>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
        </Head>

        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={dateFnsLocale}
        >
          <TransportProvider transport={ConnectTransport}>
            <QueryClientProvider client={queryClient}>
              <SessionProvider token={props.token} refetchInterval={60}>
                <UserPermissionsProvider>
                  <ThemeProvider>
                    <BreadcrumbsProvider>
                      <I18nConfirmProvider>
                        <CssBaseline />
                        <Favicon />
                        <FormRegistryProvider>
                          <FormRegistryInitializer>
                            {getLayout(<Component {...pageProps} />)}
                            <Toaster />
                            <RpgWindowManager />
                          </FormRegistryInitializer>
                        </FormRegistryProvider>
                      </I18nConfirmProvider>
                    </BreadcrumbsProvider>
                  </ThemeProvider>
                </UserPermissionsProvider>
              </SessionProvider>
            </QueryClientProvider>
          </TransportProvider>
        </LocalizationProvider>
      </CacheProvider>
      </DevToolsProvider>
    </ReactReduxProvider>
  );
};

CustomApp.getInitialProps = async (
  appContext: AppContext
): Promise<AppInitialProps & { token: JWT | null }> => {
  const appProps = await App.getInitialProps(appContext);
  let cookieString = appContext.ctx.req?.headers.cookie;
  if (!cookieString) {
    if (typeof document !== 'undefined') {
      cookieString = document.cookie;
    }
  }
  try {
    const token = await getToken({ cookieString: cookieString });
    return { ...appProps, token };
  } catch (e) {
    console.error('error getting token', e);
    return { ...appProps, token: null };
  }
};

// Note: When using appWithTranslation, translations are automatically loaded
// Individual pages can override this by providing their own getServerSideProps
// with serverSideTranslations for page-specific namespaces

export default wrapper.withRedux(appWithTranslation(CustomApp));
