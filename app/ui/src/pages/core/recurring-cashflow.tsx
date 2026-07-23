import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {Permissions} from "@gen/permissions";
import {RecurringCashflowGrid} from "@gen/grids";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteRecurringCashflow} from '@gen/core/v1/recurring_cashflow-RecurringCashflowService_connectquery';
import {RecurringCashflowForm} from "~/sections/core/recurring-cashflow/recurring_cashflow_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('RecurringCashflowForm', RecurringCashflowForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Recurring Cashflows"
      breadcrumbLabel="Recurring Cashflows"
      permission={Permissions.RecurringCashflow}
      grid={RecurringCashflowGrid}
      gridType="RecurringCashflow"
      listViewMethod={list}
      deleteMethod={deleteRecurringCashflow}
      form={{
        formName: 'RecurringCashflowForm',
      }}
      dialogMaxWidth={"lg"}
      layout={CoreLayout}
    />
  );
};


export const getServerSideProps = withTranslations();

export default Page;
