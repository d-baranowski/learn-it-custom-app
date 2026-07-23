import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Standard props passed to every form component by RpgWindowManager.
 * - `id`         — entity id for edit forms (legacy convention; new forms also
 *                  receive `entityId` directly via the typed openForm path).
 * - `windowId`   — id of the window the form is mounted in (used by the
 *                  Redux-backed <Form> for window↔form binding).
 * - `afterSave`  — invoked by the form after a successful save; closes the window.
 * - `onCancel`   — invoked when the user dismisses without saving.
 *
 * Forms may declare additional props in their own type; FormComponent is
 * intentionally loose because RpgWindowManager spreads `formProps` generically.
 */
export type FormComponent = React.ComponentType<{
  id?: string;
  windowId?: string;
  afterSave?: (formData: any) => void;
  onCancel?: () => void;
} & Record<string, any>>;
export type FormRegistry = Record<string, FormComponent>;

export interface FormRegistryContextValue {
  /** Current registry mapping form names to components */
  registry: FormRegistry;

  /** Register/overwrite a form component by name */
  registerForm: (formName: string, component: FormComponent) => void;

  /** Lookup a registered form component */
  getFormComponent: (formName: string) => FormComponent | undefined;

  /** Mark the registry initialized (optional convenience for one-time init patterns) */
  initialize: () => void;

  /** Whether initialize() has been called */
  isInitialized: boolean;
}

const FormRegistryContext = React.createContext<FormRegistryContextValue | null>(null);

export const FormMissing: React.FC = () => (
  <Box sx={{ p: 4 }}>
    <Typography>Form is not registered</Typography>
  </Box>
);

export const FormRegistryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [registry, setRegistry] = React.useState<FormRegistry>({});
  const [isInitialized, setIsInitialized] = React.useState(false);

  const registerForm = React.useCallback((formName: string, component: FormComponent) => {
    setRegistry((prev) => ({
      ...prev,
      [formName]: component,
    }));
  }, []);

  const getFormComponent = React.useCallback(
    (formName: string) => {
      const formComponent = registry[formName];
      if (!formComponent) {
        console.warn(`Form component "${formName}" not found in registry.`);
        return FormMissing
      }
      return formComponent;
    },
    [registry],
  );

  const initialize = React.useCallback(() => {
    setIsInitialized(true);
  }, []);

  const value = React.useMemo<FormRegistryContextValue>(
    () => ({
      registry,
      registerForm,
      getFormComponent,
      initialize,
      isInitialized,
    }),
    [getFormComponent, initialize, isInitialized, registerForm, registry],
  );

  return <FormRegistryContext.Provider value={value}>{children}</FormRegistryContext.Provider>;
};

export const useFormRegistryContext = (): FormRegistryContextValue => {
  const ctx = React.useContext(FormRegistryContext);
  if (!ctx) {
    throw new Error('useFormRegistryContext must be used within a FormRegistryProvider');
  }
  return ctx;
};



