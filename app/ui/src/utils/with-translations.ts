import {serverSideTranslations} from 'next-i18next/serverSideTranslations';
import { GetServerSideProps, GetServerSidePropsContext } from 'next/types';
import { config } from '~/config';

/**
 * Higher-order function that wraps getServerSideProps to automatically
 * include translations for the 'common' namespace, plus the small set of
 * server-resolved flags every page needs.
 *
 * `devToolsEnabled` is injected here because it MUST be resolved server-side:
 * `config` is built from `process.env`, and Next.js only exposes `NEXT_PUBLIC_*`
 * to the browser, so a client component reading `config.ENABLE_DEV_TOOLS`
 * always sees the default. See `~/providers/dev-tools` for the full reasoning.
 */
const serverProps = () => ({
  devToolsEnabled: config.ENABLE_DEV_TOOLS,
});

export const withTranslations = <P extends { [key: string]: any } = { [key: string]: any }>(
  getServerSidePropsFunc?: GetServerSideProps<P>
): GetServerSideProps<P> => {
  return async (context: GetServerSidePropsContext) => {
    const locale = context.locale || 'en';
    const translations = await serverSideTranslations(locale, ['common']);

    if (!getServerSidePropsFunc) {
      return {
        props: {
          ...translations,
          ...serverProps(),
        } as P,
      };
    }

    const result = await getServerSidePropsFunc(context);

    if ('props' in result) {
      return {
        ...result,
        props: {
          ...(await result.props),
          ...translations,
          ...serverProps(),
        },
      };
    }

    return result;
  };
};
