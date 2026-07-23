import type { NextPage } from 'next';
import React from 'react';

import { withTranslations } from '~/utils/with-translations';
import { CoreLayout } from '~/sections/core/layout';
import Breadcrumb from '~/components/breadcrumb/breadcrumb';
import { WorkingHoursEditor } from '~/sections/core/working-hours/working_hours_editor';

const Page: NextPage = () => {
  return (
    <CoreLayout>
      <Breadcrumb label="Therapist Working Hours" />
      <WorkingHoursEditor />
    </CoreLayout>
  );
};

export const getServerSideProps = withTranslations();

export default Page;
