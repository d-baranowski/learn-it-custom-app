import {useFormRegistryContext} from '~/providers/form-registry';

export const useFormRegistry = () => {
  return useFormRegistryContext();
};

export const useRegisterForm = () => {
  return useFormRegistryContext().registerForm;
};

export const useGetFormComponent = () => {
  return useFormRegistryContext().getFormComponent;
};

export const useIsFormRegistryInitialized = () => {
  return useFormRegistryContext().isInitialized;
};

export const useInitializeFormRegistryFlag = () => {
  return useFormRegistryContext().initialize;
};

