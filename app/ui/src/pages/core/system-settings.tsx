import type { NextPage } from 'next';
import { withTranslations } from '~/utils/with-translations';
import React from 'react';
import { CoreLayout } from '~/sections/core/layout';
import { SystemSettingsView } from '~/sections/core/system-settings/system_settings_view';

const Page: NextPage = () => {
  return (
    <CoreLayout>
      <SystemSettingsView />
    </CoreLayout>
  );
};

export const getServerSideProps = withTranslations();
export default Page;
