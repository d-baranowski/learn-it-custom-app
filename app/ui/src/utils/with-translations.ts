import {serverSideTranslations} from 'next-i18next/serverSideTranslations';
import { GetServerSideProps, GetServerSidePropsContext } from 'next/types';

/**
 * Higher-order function that wraps getServerSideProps to automatically
 * include translations for the 'common' namespace
 */
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
        },
      };
    }

    return result;
  };
};
