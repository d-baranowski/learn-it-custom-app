import type { NextPage } from 'next';
import { withTranslations } from '~/utils/with-translations';
import React from 'react';
import { DevToolsView } from '~/sections/dev-tools/dev_tools_view';
import { Box } from '@mui/material';
import { config } from '~/config';

const Page: NextPage = () => {
  return (
    <Box sx={{
      backgroundColor: 'background.default',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <DevToolsView />
    </Box>
  );
};

// THE actual gate. Runs server-side on every request, so it reads the real
// runtime env var rather than the browser's stubbed process.env. With
// ENABLE_DEV_TOOLS off this page does not exist — navigating straight to
// /dev-tools returns 404, regardless of any hidden link elsewhere in the UI.
export const getServerSideProps = withTranslations(async () => {
  if (!config.ENABLE_DEV_TOOLS) {
    return { notFound: true };
  }

  return { props: {} as any };
});
export default Page;
