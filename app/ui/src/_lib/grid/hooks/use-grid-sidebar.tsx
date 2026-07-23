import {useCallback, useRef, useState} from 'react';

const useGridSidebar = (open?: boolean) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [openSidebar, setOpenSidebar] = useState<boolean>(open ?? false);

  const closeSidebar = useCallback((): void => {
    setOpenSidebar(false);
  }, []);

  const toggleSidebar = useCallback((): void => {
    setOpenSidebar(prevState => !prevState);
  }, []);

  return {rootRef, openSidebar, closeSidebar, toggleSidebar};
};

export default useGridSidebar;