import React from 'react';
import {useFormRegistryContext} from '~/providers/form-registry';
import initializeFormRegistry from '~/components/rpg-window-manager/form-registry';

/**
 * Initializes the Form Registry once at app startup.
 *
 * Must be rendered inside <FormRegistryProvider>.
 */
const FormRegistryInitializer: React.FC<React.PropsWithChildren> = ({children}) => {
  const {registerForm, isInitialized, initialize} = useFormRegistryContext();

  React.useEffect(() => {
    if (isInitialized) return;
    initializeFormRegistry(registerForm);
    initialize();
  }, [initialize, isInitialized, registerForm]);

  return <>{children}</>;
};

export default FormRegistryInitializer;

