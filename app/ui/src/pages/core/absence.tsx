import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {Permissions} from "@gen/permissions";
import {AbsenceGrid} from "@gen/grids";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteAbsence} from '@gen/core/v1/absence-AbsenceService_connectquery';
import {AbsenceForm} from "~/sections/core/absence/absence_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('AbsenceForm', AbsenceForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Therapist Absences"
      breadcrumbLabel="Therapist Absences"
      permission={Permissions.Absence}
      grid={AbsenceGrid}
      gridType="Absence"
      listViewMethod={list}
      deleteMethod={deleteAbsence}
      form={{
        formName: 'AbsenceForm',
      }}
      layout={CoreLayout}
    />
  );
};


export const getServerSideProps = withTranslations();

export default Page;
