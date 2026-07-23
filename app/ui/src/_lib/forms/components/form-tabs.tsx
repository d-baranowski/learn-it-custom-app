/**
 * FormTabs — tabbed layout for the new <Form>.
 *
 * Replacement for the legacy `~/components/form/tabular-form.tsx`.
 *
 * Active tab index is stored in form Redux state (`uiState.activeTabIndex`)
 * via the `formActiveTabChanged` action. This makes tab position survive
 * draft restore and stay in sync if the form is rendered in two places at
 * once (rare, but cheap to support).
 *
 * Use:
 *   <Form ...>
 *     <FormTabs>
 *       <FormTab label="English">
 *         <FormTextField name="displayName.en" required />
 *       </FormTab>
 *       <FormTab label="Polish">
 *         <FormTextField name="displayName.pl" required />
 *       </FormTab>
 *     </FormTabs>
 *   </Form>
 *
 * Children of <FormTabs> must be <FormTab> elements. Anything else throws.
 *
 * Out of scope (deferred follow-ups):
 *   - The MuiDialogContent-root height-detection from legacy TabularForm.
 *     That was a brittle DOM-traversal workaround for dialog sizing; we
 *     leave the dialog to size itself naturally and revisit if it's a
 *     real problem in practice.
 *   - "bareTabs" and "hideActionsTabs" props from the legacy. If a tab
 *     wants no action bar it shouldn't render one — ergonomics of putting
 *     the action bar at <Form> level vs per-tab is the caller's choice.
 */

import React from 'react';
import {
  Tabs,
  Tab,
  Box,
  Grid,
  Badge,
  SxProps,
  Theme,
  Breakpoint,
  useTheme,
} from '@mui/material';
import { kebabCase } from 'change-case';
import { useTranslation } from 'next-i18next';
import { useSelector } from 'react-redux';
import type { RootState } from '~/_lib/grid/state/store';
import { useFormId, useOptionalFormWindowId } from '../runtime/form-context';
import { useFormActiveTabIndex, useFormActions } from '../state/hooks';
import { useWindowActions, useWindowById } from '~/_lib/window/state/hooks';

export interface FormTabProps {
  label: string;
  value?: number;
  width?: Breakpoint | number;
  height?: number;
  icon?: React.ReactElement;
  /** Opt this tab out of the FormTabs `scrollBody` (e.g. it embeds a grid that
   * manages its own scrolling/height). */
  noScrollBody?: boolean;
  children: React.ReactNode;
}

/**
 * Marker component for a tab. Only meaningful as a child of <FormTabs>.
 * On its own it renders its children unconditionally — useful for testing.
 */
export const FormTab: React.FC<FormTabProps> = ({ children }) => {
  return <>{children}</>;
};
FormTab.displayName = 'FormTab';

export interface FormTabsProps {
  children: React.ReactNode;
  /** Initial tab index when no draft / explicit selection exists. */
  defaultIndex?: number;
  /** Override formId when used outside <Form>. */
  formId?: string;
  /**
   * Optional content rendered inside the fixed header, above the tab row —
   * e.g. an entity subtitle that should stay put while the body scrolls.
   */
  header?: React.ReactNode;
  /**
   * Scroll the active tab body internally (bounded to the dialog height) so the
   * header/tabs and the footer stay fixed. Only applies to tabs that don't set
   * their own `height` (those manage their own sizing, e.g. embedded grids).
   */
  scrollBody?: boolean;
}

function isFormTab(child: React.ReactNode): child is React.ReactElement<FormTabProps> {
  return (
    React.isValidElement(child) &&
    typeof child.type !== 'string' &&
    (child.type as { displayName?: string }).displayName === 'FormTab'
  );
}

/**
 * Tab item wrapped in a `<Badge color="error" variant="dot">`. Always
 * wrapped (badge invisible when no error) so Cypress assertions like
 * `.parent('.MuiBadge-root')` can locate the Tab regardless of state.
 *
 * MUI `<Tabs>` uses cloneElement on its children to pass `value`,
 * `selected`, `onChange`, `textColor`, `indicator` etc. We accept those
 * on the wrapper and spread them to the inner `<Tab>` so the active-tab
 * logic keeps working.
 */
interface TabWithErrorBadgeProps {
  label: React.ReactNode;
  value: number;
  errorCount: number;
  'data-testid': string;
  // Tab cloneElement props pumped in by MUI Tabs (selected, onChange,
  // textColor, indicator, etc.) — passed through opaquely.
  [key: string]: React.ReactNode | unknown;
}

const TabWithErrorBadge = React.forwardRef<HTMLDivElement, TabWithErrorBadgeProps>(
  function TabWithErrorBadge(props, ref) {
    const errorCount = (props.errorCount ?? 0) as number;
    const { errorCount: _omit, ...tabProps } = props;
    void _omit;
    // Wrapping Tab in Badge introduces a `<span class="MuiBadge-root">`
    // around each tab, which collapses the default tab spacing — restore
    // it with paddingX on the inner Tab (same approach as legacy rpg-tab).
    const inner = tabProps as { sx?: SxProps<Theme> } & object;
    const mergedSx: SxProps<Theme> = inner.sx
      ? { paddingX: 2, ...(inner.sx as object) }
      : { paddingX: 2 };
    return (
      <Badge
        color="error"
        badgeContent={errorCount}
        invisible={errorCount === 0}
        sx={{
          '& .MuiBadge-badge': {
            right: -4,
            top: 4,
            transformOrigin: 'center',
          },
          '& .MuiBadge-badge:not(.MuiBadge-invisible)': {
            transform: 'scale(1)',
          },
        }}
      >
        <Tab {...inner} sx={mergedSx} ref={ref} />
      </Badge>
    );
  }
);

/**
 * Tab index for the surrounding <FormTab>. Read by useFormController so
 * each registered field knows which tab it lives in — the form slice
 * stores it on `fields[name].tabIndex`, and FormTabs uses that to render
 * an error badge on tabs whose fields are in error after validation.
 *
 * `undefined` outside any FormTab.
 */
export const FormTabIndexContext = React.createContext<number | undefined>(undefined);

export const FormTabs: React.FC<FormTabsProps> = ({
  children,
  defaultIndex = 0,
  formId: propFormId,
  header,
  scrollBody = false,
}) => {
  const { t } = useTranslation('common');
  const ctxFormId = useFormId();
  const formId = propFormId ?? ctxFormId;
  const windowId = useOptionalFormWindowId();
  const theme = useTheme();
  const { updateWindowSize } = useWindowActions();

  const stored = useFormActiveTabIndex(formId);
  const active = stored ?? defaultIndex;
  const actions = useFormActions(formId);
  const windowState = useWindowById(windowId ?? '');
  // Bound a scrolling body to the window height, reserving room for the fixed
  // header (title + subtitle + tab row) and the footer.
  const bodyMaxHeight = windowState?.size?.height
    ? `calc(${windowState.size.height}px - 220px)`
    : undefined;

  const tabs = React.Children.toArray(children).filter(isFormTab);
  if (tabs.length === 0) {
    throw new Error('<FormTabs> must contain at least one <FormTab>');
  }

  const activeTab = tabs.find((_, i) => (tabs[i].props.value ?? i) === active);
  const tabWidth = activeTab?.props.width;
  const tabHeight = activeTab?.props.height;

  React.useEffect(() => {
    if (!windowId) return;
    if (tabWidth === undefined && tabHeight === undefined) return;

    const widthPx =
      typeof tabWidth === 'number'
        ? tabWidth
        : tabWidth !== undefined
          ? theme.breakpoints.values[tabWidth]
          : (windowState?.size?.width ?? theme.breakpoints.values.md);
    const heightPx = tabHeight ?? windowState?.size?.height ?? 600;

    updateWindowSize(windowId, { width: widthPx, height: heightPx });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, windowId, tabWidth, tabHeight]);

  // Per-tab error count, derived from the form slice. Each Fe registers
  // its tab index (from FormTabIndexContext) at mount time; the slice
  // tracks errors keyed by field name. A tab's count is the number of
  // its registered fields that have an error (matched exactly, or by
  // prefix on either side so a `displayName.en` error attaches to a tab
  // whose Fe is `displayName` and vice versa).
  const tabErrorCounts = useSelector((s: RootState) => {
    const form = s.forms.byId[formId];
    if (!form) return tabs.map(() => 0);
    const counts = tabs.map(() => 0);
    const errKeys = Object.keys(form.errors);
    for (const fieldName in form.fields) {
      const meta = form.fields[fieldName];
      const ti = meta.tabIndex;
      if (ti === undefined) continue;
      for (const errKey of errKeys) {
        if (
          errKey === fieldName ||
          errKey.startsWith(`${fieldName}.`) ||
          fieldName.startsWith(`${errKey}.`)
        ) {
          counts[ti] += 1;
          break;
        }
      }
    }
    return counts;
  }, ((a: number[], b: number[]) =>
      a.length === b.length && a.every((v, i) => v === b[i])) as never);

  // FormTabs is a top-level layout child of <Form>'s Grid container, so it
  // renders as a full-width Grid item. Each tab body provides its own
  // Grid container so child Fes can default to xs=6 (legacy parity).
  return (
    <Grid item xs={12}>
      <Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mx: -3 }}>
          {header ? <Box sx={{ mx: 3, pt: 1 }}>{header}</Box> : null}
          <Box sx={{ mx: 3 }}>
          <Tabs
            value={active}
            onChange={(_, value) => actions.setActiveTab(value as number)}
            aria-label="Form Tabs"
            data-testid="form-tabs"
            sx={{
              '&& .MuiTabs-scroller': { overflow: 'visible' },
              '&& .MuiTabs-flexContainer': { overflow: 'visible' },
            }}
          >
            {tabs.map((tab, i) => (
              <TabWithErrorBadge
                key={i}
                label={tab.props.icon ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {t(tab.props.label)}
                    {tab.props.icon}
                  </Box>
                ) : t(tab.props.label)}
                value={tab.props.value ?? i}
                data-testid={`tab-${kebabCase(tab.props.label)}`}
                // Forwarded as a DOM attribute on the underlying <button> so
                // the legacy Cypress `button[tab]` selector still resolves.
                tab={tab.props.label}
                errorCount={tabErrorCounts[i]}
              />
            ))}
          </Tabs>
          </Box>
        </Box>
        {tabs.map((tab, i) => {
          const value = tab.props.value ?? i;
          // Render every tab's content but hide inactive ones with CSS so
          // their fields stay mounted (their values stay in Redux). Mounting
          // and unmounting fields per tab change would dispatch
          // fieldRegistered/fieldUnregistered storms — wasteful and brittle.
          const isActive = value === active;
          // Tabs that manage their own height (e.g. embedded grids) opt out.
          const panelScrolls =
            scrollBody && !tab.props.noScrollBody && !!bodyMaxHeight;
          return (
            <Box
              key={i}
              role="tabpanel"
              hidden={!isActive}
              sx={{
                display: isActive ? 'block' : 'none',
                pt: 2,
                ...(panelScrolls
                  ? { overflowY: 'auto', maxHeight: bodyMaxHeight }
                  : {}),
              }}
            >
              <FormTabIndexContext.Provider value={i}>
                <Grid container spacing={1}>{tab.props.children}</Grid>
              </FormTabIndexContext.Provider>
            </Box>
          );
        })}
      </Box>
    </Grid>
  );
};
