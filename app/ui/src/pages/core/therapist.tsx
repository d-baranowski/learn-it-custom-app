import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {Permissions} from "@gen/permissions";
import {TherapistGrid} from "@gen/grids";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteTherapist} from '@gen/core/v1/therapist-TherapistService_connectquery';
import {TherapistForm} from "~/sections/core/therapist/therapist_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('TherapistForm', TherapistForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Therapist"
      breadcrumbLabel="Therapist"
      permission={Permissions.Therapist}
      grid={TherapistGrid}
      gridType="Therapist"
      listViewMethod={list}
      deleteMethod={deleteTherapist}
      form={{
        formName: 'TherapistForm',
      }}
      layout={CoreLayout}
    />
  );
};


export const getServerSideProps = withTranslations();

export default Page;
