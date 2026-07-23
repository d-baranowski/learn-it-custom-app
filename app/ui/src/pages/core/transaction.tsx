import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {Permissions} from "@gen/permissions";
import {TransactionGrid} from "@gen/grids";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteTransaction} from '@gen/core/v1/transaction-TransactionService_connectquery';
import {TransactionForm} from "~/sections/core/transaction/transaction_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('TransactionForm', TransactionForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Transactions"
      breadcrumbLabel="Transactions"
      permission={Permissions.Transaction}
      grid={TransactionGrid}
      gridType="Transaction"
      listViewMethod={list}
      deleteMethod={deleteTransaction}
      form={{
        formName: 'TransactionForm',
      }}
      layout={CoreLayout}
    />
  );
};


export const getServerSideProps = withTranslations();

export default Page;
