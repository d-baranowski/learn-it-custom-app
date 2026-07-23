import React from 'react';
import { useTranslation } from 'next-i18next';
import { useGridSettings } from '~/_lib/grid/context/grid-settings-context';
import { useWindowActions, useWindows } from '~/_lib/window/state/hooks';

const useFiltersModal = () => {
  const { t } = useTranslation('common');
  const {gridName} = useGridSettings();
  const registryName = gridName + '_filters-modal';
  const { openWindow, closeWindow } = useWindowActions();
  const windows = useWindows();
  const isOpen = !!windows[registryName]?.isOpen;
  const toggle = React.useCallback(() => {
    if (isOpen) {
      closeWindow(registryName);
    } else {
      openWindow({
        title: t('Filters'),
        formName: registryName,
        windowId: registryName,
        initialHeight: 600,
      });
    }
  }, [isOpen, openWindow, closeWindow, registryName, t]);

  return { isOpen, toggle };
};

export default useFiltersModal;
