import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RecentlyOpenedEntry {
  rowId: string;
  openedAt: number;
}

export interface RecentlyOpenedState {
  byGrid: Record<string, RecentlyOpenedEntry>;
}

export const RECENT_ROW_WINDOW_MS = 10 * 60 * 1000;

const initialState: RecentlyOpenedState = {
  byGrid: {},
};

const recentlyOpenedSlice = createSlice({
  name: 'recentlyOpened',
  initialState,
  reducers: {
    rowOpened(
      state,
      action: PayloadAction<{ gridName: string; rowId: string; at?: number }>,
    ) {
      const { gridName, rowId } = action.payload;
      const at = action.payload.at ?? Date.now();
      state.byGrid[gridName] = { rowId, openedAt: at };
    },
  },
});

export const { rowOpened } = recentlyOpenedSlice.actions;
export const RecentlyOpenedReducer = recentlyOpenedSlice.reducer;
