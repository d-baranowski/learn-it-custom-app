import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {CoreLayout} from "~/sections/core/layout";
import {RoomCalendarView} from "~/sections/core/room-calendar/room_calendar_view";
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const Page: NextPage = () => {
  return (
    <CoreLayout>
      <RoomCalendarView />
    </CoreLayout>
  );
};

export const getServerSideProps = withTranslations();

export default Page;
