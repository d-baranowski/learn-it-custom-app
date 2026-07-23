import React, {useCallback, useState} from "react";
import {ContextMenuState} from "./context-menu";

export const useContextMenu = <T extends any>(xOffset = 0, yOffset = 0) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState<T>>({mouseX: null, mouseY: null});

  const openContextMenu = useCallback((event: React.MouseEvent, data?: T) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - xOffset,
      mouseY: event.clientY - yOffset,
      data,
    });
  }, [xOffset, yOffset]);

  const closeContextMenu = useCallback(() => {
    setContextMenu({mouseX: null, mouseY: null, data: undefined});
  }, []);

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
};