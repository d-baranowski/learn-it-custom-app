import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';

import {
  create,
  get,
  list,
  update,
  delete$ as deleteIssuesAndSuggestions,
} from '@gen/core/v1/issues_and_suggestions-IssuesAndSuggestionsService_connectquery';
import {
  IssuesAndSuggestions,
  IssuesAndSuggestionsComment,
  IssuesAndSuggestionsStatus,
  SaveIssuesAndSuggestionsRequest,
} from '@gen/core/v1/issues_and_suggestions_pb';
import { Permissions } from '@gen/permissions';

import { Form } from '~/_lib/forms/components/form';
import { FormTabs, FormTab } from '~/_lib/forms/components/form-tabs';
import { StringFe } from '~/components/form/elements/string-fe';
import { EnumFe } from '~/components/form/elements/enum-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFieldValue, useFormActions } from '~/_lib/forms/state/hooks';
import { useOpenForm, OpenFormArgs } from '~/_lib/forms/use-open-form';

import { useSession } from '~/auth/session-provider';

export interface OpenIssuesAndSuggestionsFormArgs
  extends Pick<OpenFormArgs<IssuesAndSuggestions>, 'maxWidth' | 'initialHeight' | 'initialWidth'> {
  /** null = create a new record; otherwise edit that record id. */
  entityId: string | null;
  /** Window title. */
  title: string;
  /** Runs after each successful save with the saved record. */
  afterSave?: (saved: IssuesAndSuggestions) => void;
}

/**
 * Opens the IssuesAndSuggestionsForm window with `formName`/`entityType`
 * pre-bound and a correctly-typed `afterSave`.
 */
export function useOpenIssuesAndSuggestionsForm() {
  const { openForm } = useOpenForm();
  return React.useCallback(
    ({
      entityId,
      title,
      afterSave,
      maxWidth,
      initialHeight,
      initialWidth,
    }: OpenIssuesAndSuggestionsFormArgs) =>
      openForm<IssuesAndSuggestions>({
        formName: 'IssuesAndSuggestionsForm',
        entityType: 'issues-and-suggestions',
        entityId,
        title,
        maxWidth,
        initialHeight,
        initialWidth,
        afterSave,
      }),
    [openForm]
  );
}

interface Props {
  id?: string;
  afterSave?: (formData: IssuesAndSuggestions) => void;
  onCancel?: () => void;
  windowId?: string;
}

export const IssuesAndSuggestionsForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  const { t } = useTranslation('common');

  const defaultValues = React.useMemo<Record<string, unknown>>(
    () => ({
      status: IssuesAndSuggestionsStatus.OPEN,
      comments: [],
    }),
    []
  );

  return (
    <Form<SaveIssuesAndSuggestionsRequest, IssuesAndSuggestions>
      entityType="issues-and-suggestions"
      entityId={id ?? null}
      protoConstructor={SaveIssuesAndSuggestionsRequest}
      io={{ get, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as IssuesAndSuggestions)}
      defaultValues={defaultValues}
    >
      <FormTabs>
        <FormTab label={t('Issue Details')}>
          <StringFe name="title" label={t('Title')} required fullWidth />
          <StringFe
            name="description"
            label={t('Description')}
            fullWidth
            multiline
            rows={6}
          />
          <EnumFe
            name="status"
            label={t('Status')}
            required
            enumKey="IssuesAndSuggestionsStatus"
          />
        </FormTab>
        <FormTab label={t('Discussion')}>
          <DiscussionTab />
        </FormTab>
      </FormTabs>
      <FormActionsDropdown
        permission={Permissions.IssuesAndSuggestions}
        deleteDescriptor={deleteIssuesAndSuggestions}
        entityId={id}
        onDeleteSuccess={onCancel}
      />

      <FormActions>
        <SaveButton />
        <CancelButton onClick={onCancel} />
      </FormActions>
    </Form>
  );
};

const DiscussionTab: React.FC = () => {
  const { t } = useTranslation('common');
  const { session } = useSession();
  const formId = useFormId();
  const actions = useFormActions(formId);

  const comments =
    useFieldValue<IssuesAndSuggestionsComment[]>(formId, 'comments') ?? [];

  const [newCommentText, setNewCommentText] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const currentUserId = session?.user?.id || '';
  const currentUserLabel = session?.user?.displayName || 'Current User';

  const writeComments = (next: IssuesAndSuggestionsComment[]) =>
    actions.changeField('comments', next);

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    // Plain object (matches protobuf-es JSON form: int64 → string) so
    // Redux DevTools can serialize the form state. The proto constructor
    // on submit rebuilds IssuesAndSuggestionsComment from this shape.
    const newComment = {
      id: `temp_${Date.now()}`,
      userId: currentUserId,
      userLabel: currentUserLabel,
      text: newCommentText.trim(),
      createdAt: String(Math.floor(Date.now() / 1000)),
    } as unknown as IssuesAndSuggestionsComment;
    writeComments([...comments, newComment]);
    setNewCommentText('');
  };

  const handleDeleteComment = (index: number) => {
    writeComments(comments.filter((_c, i) => i !== index));
  };

  const handleStartEdit = (index: number, text: string) => {
    setEditingIndex(index);
    setEditText(text);
  };

  const handleSaveEdit = (index: number) => {
    if (!editText.trim()) return;
    const next = [...comments];
    next[index] = {
      ...next[index],
      text: editText.trim(),
    } as IssuesAndSuggestionsComment;
    writeComments(next);
    setEditingIndex(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  return (
    <Box sx={{ p: 1, width: '100%' }}>
      <Typography sx={{ marginBottom: 1 }} variant="h6" gutterBottom>
        {t('Comments')} ({comments.length})
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder={t('Add a comment...')}
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          sx={{ mb: 2 }}
      />
        <Button
          variant="contained"
          onClick={handleAddComment}
          disabled={!newCommentText.trim()}
        >
          {t('Add Comment')}
        </Button>
      </Paper>

      {comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('No comments yet. Add your first comment above.')}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {comments.map((comment, index) => {
            const isOwnComment = comment.userId === currentUserId;
            const isEditing = editingIndex === index;
            return (
              <Paper key={index} elevation={1} sx={{ p: 1 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={comment.userLabel || t('Unknown User')}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {comment.createdAt
                        ? new Date(
                            Number(comment.createdAt) * 1000
                          ).toLocaleString()
                        : ''}
                    </Typography>
                  </Stack>
                  {isOwnComment && !isEditing && (
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleStartEdit(index, comment.text)}
                        aria-label={t('Edit')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteComment(index)}
                        aria-label={t('Delete')}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                </Stack>
                {isEditing ? (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      sx={{ mb: 1 }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleSaveEdit(index)}
                        disabled={!editText.trim()}
                      >
                        {t('Save')}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleCancelEdit}
                      >
                        {t('Cancel')}
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="body2">{comment.text}</Typography>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};
