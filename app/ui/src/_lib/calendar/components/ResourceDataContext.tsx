// Context for resource data (working hours/absence)
import _ from "lodash";
import React, { createContext, useContext } from 'react';
import { ResourceMap, CalendarEvent } from "~/_lib/calendar/types";
import { View, SlotInfo } from "react-big-calendar";

export interface ResourceDataContextValue {
  resourceDataMap: Map<string, ResourceMap>;
  handleNavigate: (newDate: Date) => void;
  handleViewChange: (newView: View) => void;
  handleNavigateToView: (newDate: Date, newView: View) => void;
  monthDayEventCounts: Map<string, number>;
  yearDayCounts: Map<string, number>;
  handleDoubleClickEvent?: (event: CalendarEvent) => void;
  handleSelectSlot?: (slotInfo: SlotInfo) => void;
  handleSlotCreate?: (slotInfo: SlotInfo) => void;
  onContextMenuEvent?: (event: CalendarEvent, e: React.MouseEvent) => void;
  filterComponent?: React.FunctionComponent<{ filters: object | undefined; setFilters: ((filters: object) => void) | undefined }>;
  filters?: object;
  setFilters?: (filters: object) => void;
  highlightedEventIds: Set<string>;
}

const defaultValue: ResourceDataContextValue = {
  resourceDataMap: new Map(),
  handleNavigate: _.noop,
  handleViewChange: _.noop,
  handleNavigateToView: _.noop,
  monthDayEventCounts: new Map(),
  yearDayCounts: new Map(),
  handleDoubleClickEvent: undefined,
  handleSelectSlot: undefined,
  handleSlotCreate: undefined,
  onContextMenuEvent: undefined,
  filterComponent: undefined,
  highlightedEventIds: new Set<string>(),
};

export const ResourceDataContext = createContext<ResourceDataContextValue>(defaultValue);

export function ResourceDataProvider(
  props: React.PropsWithChildren<{ value: ResourceDataContextValue }>
) {
  return (
    <ResourceDataContext.Provider value={props.value}>
      {props.children}
    </ResourceDataContext.Provider>
  );
}

export function useResourceDataContext(): ResourceDataContextValue {
  return useContext(ResourceDataContext);
}
