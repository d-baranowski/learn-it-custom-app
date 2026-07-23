import { configureStore } from '@reduxjs/toolkit';
import { FormsReducer, FormsState } from '~/_lib/forms/state/forms-slice';

export function createTestStore() {
  return configureStore({
    reducer: {
      forms: FormsReducer,
      grids: () => ({}),
      sideNav: () => ({}),
      windows: () => ({}),
      optimisticRows: () => ({}),
      recentlyOpened: () => ({}),
    },
  });
}

export type TestStore = ReturnType<typeof createTestStore>;

// Tests often build their own store with extra slice state; the form
// helpers only care that a `forms` slice exists, so accept any such store.
type FormsSliceStore = { getState(): { forms: FormsState } };

export function getFormId(store: FormsSliceStore): string {
  const ids = Object.keys(store.getState().forms.byId);
  if (ids.length === 0) throw new Error('No form created in store');
  return ids[0];
}

export function getFormValues(store: FormsSliceStore): Record<string, unknown> {
  return store.getState().forms.byId[getFormId(store)]?.values ?? {};
}
