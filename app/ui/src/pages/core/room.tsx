import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {Permissions} from "@gen/permissions";
import {RoomGrid} from "@gen/grids";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteRoom} from '@gen/core/v1/room-RoomService_connectquery';
import {RoomForm} from "~/sections/core/room/room_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('RoomForm', RoomForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Room"
      breadcrumbLabel="Room"
      permission={Permissions.Room}
      grid={RoomGrid}
      gridType="Room"
      listViewMethod={list}
      deleteMethod={deleteRoom}
      form={{
        formName: 'RoomForm',
      }}
      layout={CoreLayout}
    />
  );
};


export const getServerSideProps = withTranslations();

export default Page;
