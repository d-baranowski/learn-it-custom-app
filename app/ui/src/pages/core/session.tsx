import type {NextPage} from 'next';
import {withTranslations} from '~/utils/with-translations';
import React from 'react';
import BlockIcon from '@mui/icons-material/Block';
import UndoIcon from '@mui/icons-material/Undo';
import { useTranslation } from 'next-i18next';

import {Permissions} from "@gen/permissions";
import {SessionGrid} from "@gen/grids";
import {Session} from "@gen/core/v1/session_pb";
import GridPage from '~/_lib/grid/page';
import {list, delete$ as deleteSession} from '@gen/core/v1/session-SessionService_connectquery';
import {GridContextMenuData} from '~/_lib/grid/pure-grid';
import {SessionForm} from "~/sections/core/session/session_form";
import {CoreLayout} from "~/sections/core/layout";
import { useRegisterForm } from '~/hooks/use-form-registry';
import { SessionCancellationDialog } from '~/sections/core/session/session_cancellation_dialog';

// Patch the generated SessionGrid to use the locale-aware dateString renderer
// for the "date" column (which carries YYYY-MM-DD ISO strings from the backend).
// We avoid editing gen/grids.ts directly as it is auto-generated.
const SessionGridPatched = {
  ...SessionGrid,
  columns: SessionGrid.columns.map((col) =>
    col.id === 'date' ? { ...col, columnRendererType: 'dateString' } : col
  ),
};

const Page: NextPage = () => {
  const { t } = useTranslation();
  const registerForm = useRegisterForm();
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [wizardMode, setWizardMode] = React.useState<'cancel' | 'undo'>(
    'cancel'
  );
  const [selectedSessionId, setSelectedSessionId] = React.useState<
    string | undefined
  >();

  React.useEffect(() => {
    registerForm('SessionForm', SessionForm);
  }, [registerForm]);

  const contextMenuItems = React.useCallback(
    (data?: GridContextMenuData<Session>) => {
      const row = data?.row;
      if (!row?.id) return [];

      const isCancelled = !!row.cancelledAt;
      return [
        {
          testId: isCancelled ? 'session-undo-cancellation' : 'session-cancel',
          label: isCancelled ? t('Undo Cancellation') : t('Cancel Session'),
          icon: isCancelled ? (
            <UndoIcon fontSize="small" />
          ) : (
            <BlockIcon fontSize="small" />
          ),
          onClick: () => {
            setSelectedSessionId(row.id);
            setWizardMode(isCancelled ? 'undo' : 'cancel');
            setWizardOpen(true);
          },
        },
      ];
    },
    [t]
  );

  return (
    <>
      <GridPage
        seoTitle="Session"
        breadcrumbLabel="Session"
        permission={Permissions.Session}
        grid={SessionGridPatched}
        gridType="Session"
        listViewMethod={list}
        deleteMethod={deleteSession}
        form={{
          formName: 'SessionForm',
        }}
        layout={CoreLayout}
        contextMenuItems={contextMenuItems}
      />
      <SessionCancellationDialog
        open={wizardOpen}
        mode={wizardMode}
        sessionId={selectedSessionId}
        onClose={() => setWizardOpen(false)}
      />
    </>
  );
};

export const getServerSideProps = withTranslations();

export default Page;
