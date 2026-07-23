import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {Permissions} from "@gen/permissions";
import {TherapistServiceLinkGrid} from "@gen/grids";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteTherapistServiceLink} from '@gen/core/v1/therapist_service-TherapistServiceLinkService_connectquery';
import {TherapistServiceForm} from "~/sections/core/therapist-service/therapist_service_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('TherapistServiceForm', TherapistServiceForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Therapist Service"
      breadcrumbLabel="Therapist Service"
      permission={Permissions.TherapistService}
      grid={TherapistServiceLinkGrid}
      gridType="TherapistServiceLink"
      listViewMethod={list}
      deleteMethod={deleteTherapistServiceLink}
      dialogTitle="Assign service"
      dialogMaxWidth="sm"
      dialogInitialHeight={360}
      form={{
        formName: 'TherapistServiceForm',
      }}
      layout={CoreLayout}
    />
  );
};


export const getServerSideProps = withTranslations();

export default Page;
