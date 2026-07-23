import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {CoreLayout} from "~/sections/core/layout";
import {WorkingHoursView} from "~/sections/core/working-hours/working_hours_view";

const Page: NextPage = () => {
  return (
    <CoreLayout>
      <WorkingHoursView />
    </CoreLayout>
  );
};

export const getServerSideProps = withTranslations();

export default Page;
