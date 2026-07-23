import type {FC} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {styled} from '@mui/material/styles';
import {useTranslation} from 'next-i18next';
import {useOpenIssuesAndSuggestionsForm} from '~/sections/core/issues-and-suggestions/issues_and_suggestions_form';

const BannerRoot = styled('div')(({theme}) => ({
  backgroundColor:
    theme.palette.mode === 'dark' ? theme.palette.neutral![800] : theme.palette.neutral![100],
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2),
}));

export const BugBountyBanner: FC = () => {
  const {t} = useTranslation('common');
  const openIssuesForm = useOpenIssuesAndSuggestionsForm();

  const handleSendFeedback = () => {
    openIssuesForm({
      entityId: null,
      title: t('Send feedback'),
    });
  };

  return (
    <BannerRoot data-testid="bug-bounty-banner">
      <Box sx={{display: 'flex', alignItems: 'center'}}>
        <InfoOutlinedIcon sx={{mr: 1, fontSize: 20, color: 'text.secondary'}} />
        <Typography variant="body2" color="text.secondary">
          {t('Spot a bug or have an idea?')}
        </Typography>
      </Box>
      <Link
        component="button"
        variant="subtitle2"
        underline="none"
        onClick={handleSendFeedback}
        sx={{
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
      >
        {t('Send feedback')} &rarr;
      </Link>
    </BannerRoot>
  );
};
