import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {CoreLayout} from "~/sections/core/layout";
import {TherapistCalendarView} from "~/sections/core/therapist-calendar/therapist_calendar_view";
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const Page: NextPage = () => {
  return (
    <CoreLayout>
      <TherapistCalendarView />
    </CoreLayout>
  );
};

export const getServerSideProps = withTranslations();

export default Page;
