import React from 'react';
import _ from 'lodash';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@connectrpc/connect-query';
import {
  get as getTemplate,
  create,
  update,
  list,
  softDelete as deleteTemplate,
} from '@gen/notification/v1/notification_template-NotificationTemplateService_connectquery';
import { get as getEventType } from '@gen/notification/v1/notification_event_type-NotificationEventTypeService_connectquery';
import { NotificationTemplate, SaveNotificationTemplateRequest } from '@gen/notification/v1/notification_template_pb';
import { NotificationDeliveryMechanism } from '@gen/notification/v1/notification_common_pb';
import { Permissions } from '@gen/permissions';

import { Form } from '~/_lib/forms/components/form';
import { useFormId } from '~/_lib/forms/runtime/form-context';
import { useFieldValue, useFieldError, useFormActions } from '~/_lib/forms/state/hooks';
import { useFormController } from '~/_lib/forms/runtime/use-form-controller';
import { StringFe } from '~/components/form/elements/string-fe';
import { SaveButton } from '~/components/form/elements/save-button';
import { CancelButton } from '~/components/form/elements/cancel-button';
import { FormActions } from '~/components/form/elements/form-actions';
import { FormActionsDropdown } from '~/components/form/elements/form-actions-dropdown';
import Grid from '@mui/material/Grid';
import { toast } from 'react-hot-toast';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import AddIcon from '@mui/icons-material/Add';

interface Props {
  id?: string;
  afterSave?: (formData: NotificationTemplate) => void;
  onCancel?: () => void;
  windowId?: string;
}

interface VariantData {
  languageCode: string;
  deliveryMechanism: number;
  subject: string;
  body: string;
}

const MECHANISM_OPTIONS = [
  { value: NotificationDeliveryMechanism.EMAIL, label: 'Email' },
  { value: NotificationDeliveryMechanism.SMS, label: 'SMS' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'pl', label: 'Polski' },
  { value: 'vi', label: 'Tiếng Việt' },
];

const SAMPLE_DATA: Record<string, string> = {
  'customer.firstName': 'Anna',
  'customer.fullName': 'Anna Kowalska',
  'session.id': 'abc123',
  'session.date': '15 Feb 2027',
  'session.startAt': '2027-02-15 10:00',
  'session.amountDue': '250',
  'session.currency': 'zł',
  'therapist.fullName': 'Dr. Marta Kuczek',
  'payment.link': 'https://pay.utro.app/abc123',
};

function renderPreview(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{\{?([^}]+)\}\}\}?/g, (_, key: string) => {
    const trimmed = key.trim();
    return data[trimmed] ?? `{{${trimmed}}}`;
  });
}

function highlightMustache(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\{\{\{?#?\/?[^}]+\}\}\}?)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const raw = match[1];
    const inner = raw.replace(/^\{\{\{?#?\/?|\/?\}\}\}?$/g, '').trim();
    parts.push(
      <span
        key={match.index}
        style={{
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          fontSize: '12px',
          background: '#F4F1F9',
          color: '#534AB7',
          padding: '1px 6px',
          borderRadius: '3px',
        }}
      >
        {inner}
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function highlightMustacheMultiline(text: string): React.ReactNode[] {
  return text.split('\n').flatMap((line, i) => {
    const highlighted = highlightMustache(line);
    return i > 0 ? [<br key={`br-${i}`} />, ...highlighted] : highlighted;
  });
}

interface MustacheTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  multiline?: boolean;
  inputRef?: React.Ref<HTMLTextAreaElement>;
  endAdornment?: React.ReactNode;
}

const MustacheTextField: React.FC<MustacheTextFieldProps> = ({
  label,
  value,
  onChange,
  required,
  rows = 1,
  multiline,
  inputRef,
  endAdornment,
}) => {
  const isMultiline = multiline || rows > 1;
  const sharedFont = {
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: '1.6',
  };

  return (
    <Box sx={{
      position: 'relative',
      bgcolor: '#F6F4EE',
      borderRadius: '6px',
      p: '9px 12px',
      mb: 0.5,
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography sx={{ fontSize: '11px', color: '#5F5E5A' }}>
          {label} {required && <span style={{ color: '#A32D2D' }}>*</span>}
        </Typography>
        {endAdornment}
      </Box>
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            ...sharedFont,
            color: '#2C2C2A',
            pointerEvents: 'none',
            whiteSpace: isMultiline ? 'pre-wrap' : 'pre',
            wordBreak: 'break-word',
            minHeight: isMultiline ? `${(rows ?? 6) * 1.6}em` : undefined,
          }}
        >
          {highlightMustacheMultiline(value || ' ')}
        </Box>
        <Box
          component={isMultiline ? 'textarea' : 'input'}
          ref={inputRef}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => onChange(e.target.value)}
          rows={isMultiline ? rows : undefined}
          sx={{
            ...sharedFont,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            color: 'transparent',
            caretColor: '#2C2C2A',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: 0,
            overflow: 'auto',
          }}
        />
      </Box>
    </Box>
  );
};

const InsertVariableButton: React.FC<{
  fields: string[];
  onInsert: (variable: string) => void;
}> = ({ fields, onInsert }) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  if (fields.length === 0) return null;

  return (
    <>
      <Button
        size="small"
        variant="text"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ fontSize: '0.75rem', textTransform: 'none' }}
      >
        + {t('Insert variable')}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {fields.map((field) => (
          <MenuItem
            key={field}
            onClick={() => { onInsert(`{{${field}}}`); setAnchorEl(null); }}
            sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          >
            {field}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const VariantPreview: React.FC<{ subject?: string; body: string }> = ({ subject, body }) => {
  const { t } = useTranslation();
  const renderedSubject = subject ? renderPreview(subject, SAMPLE_DATA) : undefined;
  const renderedBody = renderPreview(body, SAMPLE_DATA);

  if (!body) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {t('Preview')} · {t('with sample data')}
      </Typography>
      <Box sx={{ mt: 0.5, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
        {renderedSubject && (
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            {renderedSubject}
          </Typography>
        )}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {renderedBody}
        </Typography>
      </Box>
    </Box>
  );
};


const VariantsEditor: React.FC = () => {
  const { t } = useTranslation();
  const formId = useFormId();
  const variants = useFieldValue<VariantData[]>(formId, 'variants') ?? [];
  const eventTypeKey = useFieldValue<string>(formId, 'eventTypeKey');
  const actions = useFormActions(formId);

  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [previewMode, setPreviewMode] = React.useState(false);
  const variantsError = useFieldError(formId, 'variants');

  const variantErrors = React.useMemo(() => {
    const errs: Record<number, { subject?: boolean; body?: boolean; duplicate?: boolean }> = {};
    if (!variantsError) return errs;

    const seen = new Map<string, number>();
    variants.forEach((v, i) => {
      const key = `${v.languageCode}:${v.deliveryMechanism}`;
      if (seen.has(key)) {
        errs[seen.get(key)!] = { ...errs[seen.get(key)!], duplicate: true };
        errs[i] = { ...errs[i], duplicate: true };
      }
      seen.set(key, i);
      if (!v.body?.trim()) errs[i] = { ...errs[i], body: true };
      if (v.deliveryMechanism === NotificationDeliveryMechanism.EMAIL && !v.subject?.trim()) {
        errs[i] = { ...errs[i], subject: true };
      }
    });
    return errs;
  }, [variantsError, variants]);

  React.useEffect(() => {
    if (variantsError) {
      const firstBadIdx = Object.keys(variantErrors).map(Number).sort((a, b) => a - b)[0];
      if (firstBadIdx != null) setSelectedIdx(firstBadIdx);
      setPreviewMode(false);
    }
  }, [variantsError, variantErrors]);

  const eventTypeId = eventTypeKey ? `${eventTypeKey}@v1` : undefined;
  const { data: eventType } = useQuery(getEventType, { ID: eventTypeId ?? '' }, { enabled: !!eventTypeId });
  const payloadFields = React.useMemo(
    () => eventType?.payloadFields?.map((f) => f.path) ?? [],
    [eventType?.payloadFields]
  );

  const bodyRef = React.useRef<HTMLTextAreaElement | null>(null);

  const addVariant = () => {
    const next: VariantData[] = [
      ...variants,
      { languageCode: 'en', deliveryMechanism: NotificationDeliveryMechanism.EMAIL, subject: '', body: '' },
    ];
    actions.changeField('variants', next);
    setSelectedIdx(next.length - 1);
  };

  const removeVariant = (index: number) => {
    const next = variants.filter((_, i) => i !== index);
    actions.changeField('variants', next);
    setSelectedIdx(Math.min(selectedIdx, Math.max(0, next.length - 1)));
  };

  const duplicateVariant = (index: number) => {
    const copy = { ...variants[index], languageCode: 'pl' };
    const next = [...variants, copy];
    actions.changeField('variants', next);
    setSelectedIdx(next.length - 1);
  };

  const updateVariant = (index: number, field: keyof VariantData, value: string | number) => {
    actions.changeField('variants', variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const insertAtCursor = (text: string) => {
    const el = bodyRef.current;
    const current = variant?.body ?? '';
    if (!el) {
      updateVariant(selectedIdx, 'body', current + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newValue = current.substring(0, start) + text + current.substring(end);
    updateVariant(selectedIdx, 'body', newValue);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + text.length;
      el.focus();
    });
  };

  const safeIdx = Math.min(selectedIdx, Math.max(0, variants.length - 1));
  const variant = variants[safeIdx];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="overline" color="text.secondary">{t('Variants')}</Typography>
      <Divider sx={{ mb: 0.5 }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        {t('One variant per language and channel combination. The system picks the right one based on recipient preferences.')}
      </Typography>

      <Stack direction="row" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}>
        {variants.map((v, i) => {
          const isActive = i === safeIdx;
          const hasError = !!variantErrors[i];
          return (
            <Box
              key={i}
              onClick={() => setSelectedIdx(i)}
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                px: 1.5, py: 0.75, borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                ...(hasError
                  ? { bgcolor: '#FBE9E7', border: '1.5px solid #D32F2F', color: '#D32F2F', fontWeight: 500 }
                  : isActive
                    ? { bgcolor: '#F4F1F9', border: '0.5px solid #DDD6F3', color: '#534AB7', fontWeight: 500 }
                    : { bgcolor: 'transparent', border: '0.5px solid #E0DED5', color: '#5F5E5A' }),
              }}
            >
              <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '10px', opacity: 0.7 }}>
                {v.languageCode.toUpperCase()}
              </Typography>
              {v.deliveryMechanism === NotificationDeliveryMechanism.EMAIL
                ? <EmailOutlinedIcon sx={{ fontSize: 14 }} />
                : <SmsOutlinedIcon sx={{ fontSize: 14 }} />}
              {MECHANISM_OPTIONS.find((o) => o.value === v.deliveryMechanism)?.label}
            </Box>
          );
        })}
        <Box
          onClick={addVariant}
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            px: 1.5, py: 0.75, borderRadius: '6px', fontSize: '12px',
            border: '0.5px dashed #C8C5B9', color: '#5F5E5A', cursor: 'pointer',
          }}
        >
          + {t('Add Variant')}
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Box
          onClick={() => setPreviewMode(!previewMode)}
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            px: 1.5, py: 0.625, borderRadius: '18px', fontSize: '12px', cursor: 'pointer',
            ...(previewMode
              ? { color: '#534AB7', border: '0.5px solid #DDD6F3', bgcolor: '#F4F1F9' }
              : { color: '#5F5E5A', border: '0.5px solid #E0DED5', bgcolor: '#FFFFFF' }),
          }}
        >
          {t('Preview')}
          <Box sx={{
            width: 26, height: 14, borderRadius: '7px', position: 'relative', transition: 'background 120ms',
            bgcolor: previewMode ? '#534AB7' : '#C8C5B9',
          }}>
            <Box sx={{
              position: 'absolute', top: '1.5px', width: 11, height: 11, bgcolor: 'white',
              borderRadius: '50%', transition: 'left 120ms', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              left: previewMode ? '13.5px' : '1.5px',
            }} />
          </Box>
        </Box>
      </Stack>

      {!variant && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          {t('No variants defined. Add at least one variant with a template body.')}
        </Typography>
      )}

      {variant && !previewMode && (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
            <TextField
              select
              label={t('Language')}
              value={variant.languageCode}
              onChange={(e) => updateVariant(safeIdx, 'languageCode', e.target.value)}
              size="small"
              sx={{ minWidth: 140 }}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label={t('Channel')}
              value={variant.deliveryMechanism}
              onChange={(e) => updateVariant(safeIdx, 'deliveryMechanism', Number(e.target.value))}
              size="small"
              sx={{ minWidth: 140 }}
            >
              {MECHANISM_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ flexGrow: 1 }} />
            <IconButton size="small" onClick={() => duplicateVariant(safeIdx)} title={t('Duplicate')}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => removeVariant(safeIdx)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>

          {variantErrors[safeIdx]?.duplicate && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
              {t('Duplicate variants')}: {t('another variant with the same language and channel exists')}
            </Typography>
          )}

          {variant.deliveryMechanism === NotificationDeliveryMechanism.EMAIL && (
            <TextField
              label={t('Subject')}
              value={variant.subject ?? ''}
              onChange={(e) => updateVariant(safeIdx, 'subject', e.target.value)}
              fullWidth
              required
              size="small"
              error={!!variantErrors[safeIdx]?.subject}
              helperText={variantErrors[safeIdx]?.subject ? t('Subject is required for email') : undefined}
              sx={{ mb: 1 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TextField
              label={t('Body')}
              value={variant.body}
              error={!!variantErrors[safeIdx]?.body}
              onChange={(e) => updateVariant(safeIdx, 'body', e.target.value)}
              fullWidth
              required
              multiline
              rows={6}
              size="small"
              helperText={variantErrors[safeIdx]?.body ? t('Body is required') : undefined}
              inputRef={(el: HTMLTextAreaElement | null) => { bodyRef.current = el; }}
              InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem', '& textarea': { resize: 'vertical' } } }}
            />
            <Box sx={{ position: 'absolute', top: 0, right: 13 }}>
              <InsertVariableButton
                fields={payloadFields}
                onInsert={insertAtCursor}
              />
            </Box>
          </Box>
        </Box>
      )}

      {variant && previewMode && (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">{t('With data')}:</Typography>
            <Chip label="Anna Kowalska · 15 Feb 2027" size="small" variant="outlined" />
          </Stack>

          {variant.deliveryMechanism === NotificationDeliveryMechanism.EMAIL && variant.subject && (
            <>
              <Typography variant="caption" color="text.secondary">{t('Subject')}</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                {renderPreview(variant.subject, SAMPLE_DATA)}
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
            </>
          )}

          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {renderPreview(variant.body, SAMPLE_DATA)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const ActiveToggle: React.FC = () => {
  const { t } = useTranslation();
  const formId = useFormId();
  const { field } = useFormController<boolean>({ formId, name: 'active' });
  const checked = !!field.value;

  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
      bgcolor: checked ? '#e8f5e9' : '#fbe9e7',
      borderRadius: 0.75,
      px: 1.5,
      py: 0.25,
    }}>
      <Switch
        checked={checked}
        onChange={(e) => field.onChange(e.target.checked)}
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#2e7d32',
            opacity: 1,
          },
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: '#fff',
          },
          '& .MuiSwitch-track': {
            backgroundColor: '#b71c1c',
            opacity: 0.7,
          },
        }}
      />
      <Typography variant="body2" sx={{ ml: 0.5 }}>
        {checked ? t('Active') : t('Inactive')}
      </Typography>
    </Box>
  );
};

const EventTypeHeader: React.FC = () => {
  const formId = useFormId();
  const eventTypeKey = useFieldValue<string>(formId, 'eventTypeKey');

  const eventTypeId = eventTypeKey ? `${eventTypeKey}@v1` : undefined;
  const { data: eventType } = useQuery(getEventType, { ID: eventTypeId ?? '' }, { enabled: !!eventTypeId });

  if (!eventTypeKey) return null;

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', flexWrap: 'wrap' }}>
      <Chip label={eventTypeKey} size="small" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
      {eventType?.description && (
        <Typography variant="body2" color="text.secondary">
          {eventType.description}
        </Typography>
      )}
    </Stack>
  );
};

function validateTemplateVariants(values: Record<string, unknown>, t?: (k: string) => string): Record<string, string> {
  const tr = t ?? ((k: string) => k);
  const variants = (values.variants ?? []) as VariantData[];
  const errors: Record<string, string> = {};

  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const v of variants) {
    const key = `${v.languageCode}:${v.deliveryMechanism}`;
    if (seen.has(key)) {
      const lang = v.languageCode.toUpperCase();
      const mech = MECHANISM_OPTIONS.find((o) => o.value === v.deliveryMechanism)?.label ?? '';
      duplicates.push(`${lang} ${mech}`);
    }
    seen.add(key);
  }
  if (duplicates.length > 0) {
    errors.variants = `${tr('Duplicate variants')}: ${duplicates.join(', ')}`;
  }

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const label = `${v.languageCode.toUpperCase()} ${MECHANISM_OPTIONS.find((o) => o.value === v.deliveryMechanism)?.label ?? ''}`;
    if (!v.body?.trim()) {
      errors.variants = errors.variants ?? `${label}: ${tr('Body is required')}`;
    }
    if (v.deliveryMechanism === NotificationDeliveryMechanism.EMAIL && !v.subject?.trim()) {
      errors.variants = errors.variants ?? `${label}: ${tr('Subject is required for email')}`;
    }
  }

  return errors;
}

export const NotificationTemplateForm: React.FC<Props> = ({
  id,
  afterSave = _.noop,
  onCancel = _.noop,
  windowId,
}) => {
  const { t } = useTranslation();

  return (
    <Form<SaveNotificationTemplateRequest, NotificationTemplate>
      entityType="notification-template"
      entityId={id ?? null}
      protoConstructor={SaveNotificationTemplateRequest}
      customValidation={validateTemplateVariants}
      io={{ get: getTemplate, create, update }}
      optimisticList={{ listDescriptor: list }}
      windowId={windowId}
      onCancel={onCancel}
      onSubmitSuccess={(saved) => afterSave(saved as NotificationTemplate)}
    >
      <Grid item xs={12} sx={{ mt: 1, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ width: '100%' }}>
          <EventTypeHeader />
          <ActiveToggle />
        </Stack>
      </Grid>

      <StringFe name="title" label={t('Title')} required fullWidth />
      <StringFe name="eventTypeKey" label={t('Event Type Key')} required fullWidth />
      <StringFe name="description" label={`${t('Description')} (${t('optional')})`} fullWidth multiline rows={2} />

      <Box sx={{ mt: 2, width: '100%' }}>
        <VariantsEditor />
      </Box>

      <FormActionsDropdown
        permission={Permissions.NotificationTemplate}
        deleteDescriptor={deleteTemplate}
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
