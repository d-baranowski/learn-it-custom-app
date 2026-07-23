import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import {Permissions} from "@gen/permissions";
import {IssuesAndSuggestionsGrid} from "@gen/grids";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteIssuesAndSuggestions} from '@gen/core/v1/issues_and_suggestions-IssuesAndSuggestionsService_connectquery';
import {IssuesAndSuggestionsForm} from "~/sections/core/issues-and-suggestions/issues_and_suggestions_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';

const Page: NextPage = () => {
  const registerForm = useRegisterForm();
  React.useEffect(() => {
    registerForm('IssuesAndSuggestionsForm', IssuesAndSuggestionsForm);
  }, [registerForm]);

  return (
    <GridPage
      seoTitle="Issues and Suggestions"
      breadcrumbLabel="Issues and Suggestions"
      permission={Permissions.IssuesAndSuggestions}
      grid={IssuesAndSuggestionsGrid}
      gridType="IssuesAndSuggestions"
      listViewMethod={list}
      deleteMethod={deleteIssuesAndSuggestions}
      form={{
        formName: 'IssuesAndSuggestionsForm',
      }}
      layout={CoreLayout}
    />
  );
};


export const getServerSideProps = withTranslations();

export default Page;
