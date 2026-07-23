import {createSlice, PayloadAction} from '@reduxjs/toolkit';

// Define the state structure for side navigation
export interface SideNavState {
  // Maps item title to its open state (true = open, false = closed)
  accordionStates: Record<string, boolean>;
  // Search query for filtering navigation items
  searchQuery: string;
  // Array of item titles that should be expanded due to search matches
  expandedBySearch: string[];
}

// Initial state
const initialState: SideNavState = {
  accordionStates: {},
  searchQuery: '',
  expandedBySearch: [],
};

// Create the side nav slice
const sideNavSlice = createSlice({
  name: 'sideNav',
  initialState,
  reducers: {
    toggleAccordion(state, action: PayloadAction<{ itemTitle: string }>) {
      const { itemTitle } = action.payload;
      state.accordionStates[itemTitle] = !state.accordionStates[itemTitle];
    },
    setAccordionState(state, action: PayloadAction<{ itemTitle: string; isOpen: boolean }>) {
      const { itemTitle, isOpen } = action.payload;
      state.accordionStates[itemTitle] = isOpen;
    },
    closeAllAccordions(state) {
      state.accordionStates = {};
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setExpandedBySearch(state, action: PayloadAction<string[]>) {
      state.expandedBySearch = action.payload;
    },
  },
});

export const {
  toggleAccordion,
  setAccordionState,
  closeAllAccordions,
  setSearchQuery,
  setExpandedBySearch,
} = sideNavSlice.actions;

export const SideNavReducer = sideNavSlice.reducer;
