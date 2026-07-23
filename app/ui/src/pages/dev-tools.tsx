import type { NextPage } from 'next';
import { withTranslations } from '~/utils/with-translations';
import React from 'react';
import { DevToolsView } from '~/sections/dev-tools/dev_tools_view';
import { Box } from '@mui/material';

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

export const getServerSideProps = withTranslations();
export default Page;
