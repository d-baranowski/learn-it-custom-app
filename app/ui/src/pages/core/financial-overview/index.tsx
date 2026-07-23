import type { NextPage } from 'next';
import { Seo } from 'src/components/seo';
import { Layout } from 'src/layouts';
import { FinancialOverview } from '~/sections/financial-overview';
import { withTranslations } from '~/utils/with-translations';
import { useTranslation } from 'next-i18next';

const Page: NextPage = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Seo title={t('Financial Overview')} />
      <FinancialOverview />
    </>
  );
};

Page.getLayout = (page) => <Layout>{page}</Layout>;

export const getServerSideProps = withTranslations();

export default Page;
