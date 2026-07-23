import {createWrapper, HYDRATE} from 'next-redux-wrapper';
import {Action, combineReducers, configureStore, ThunkAction} from '@reduxjs/toolkit';
import {GridsReducer, GridsState} from '~/_lib/grid/state/grids-slice';
import {SideNavReducer, SideNavState} from '~/layouts/state/side-nav-slice';
import {WindowsReducer, WindowsState} from '~/_lib/window/state/windows-slice';
import {FormsReducer, FormsState, formsActions} from '~/_lib/forms/state/forms-slice';
import {OptimisticRowsReducer, OptimisticRowsState} from '~/_lib/forms/optimistic/optimistic-rows-slice';
import {RecentlyOpenedReducer, RecentlyOpenedState} from '~/_lib/grid/state/recently-opened-slice';
import {formValidationMiddleware} from '~/_lib/forms/state/validation-middleware';
import {formErrorToastMiddleware} from '~/_lib/forms/state/error-toast-middleware';
import {formSuccessToastMiddleware} from '~/_lib/forms/state/success-toast-middleware';
import {loadDrafts, saveDrafts, selectPersistableDrafts} from '~/_lib/forms/state/forms-draft-storage';
import {windowInitialSizeMiddleware} from '~/_lib/window/state/window-initial-size-middleware';
import debounce from "lodash/debounce";
import {loadState, saveState} from '~/_lib/grid/browser_storage';

const combinedReducer = combineReducers({
  grids: GridsReducer,
  sideNav: SideNavReducer,
  windows: WindowsReducer,
  forms: FormsReducer,
  optimisticRows: OptimisticRowsReducer,
  recentlyOpened: RecentlyOpenedReducer,
});

const makeStore = () => {
  // Middleware that logs each dispatched action and the resulting state
  // const actionLogger = (storeAPI: any) => (next: any) => (action: any) => {
  //   const result = next(action);
  //   try {
  //     console.log('Dispatched action:', action);
  //     console.log('[redux-action-logger]', result, storeAPI, storeAPI.getState());
  //   } catch (e) {
  //     // ignore logging errors
  //   }
  //
  //   return result;
  // };

  const store = configureStore({
    reducer: (state, action) => {
      if (action.type === HYDRATE) {
        let a = action as {
          type: typeof HYDRATE,
          payload: any
        }
        return {
          ...state, // use previous state
          ...a.payload, // apply delta from hydration
        };
      } else {
        return combinedReducer(state, action);
      }
    },

    // here we restore the previously persisted state
    preloadedState: loadState(),
    // Add logging middleware to the default middleware chain.
    // formValidationMiddleware MUST come before getDefaultMiddleware()
    // returns its serializability check chain since RTK listenerMiddleware
    // needs to be `.prepend`ed conventionally; using concat is fine here
    // because we don't dispatch non-serializable payloads.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(formValidationMiddleware.middleware)
        .prepend(formErrorToastMiddleware.middleware)
        .prepend(formSuccessToastMiddleware.middleware)
        .concat(windowInitialSizeMiddleware) /*.concat(actionLogger) */,
  });

  // Existing persistence subscriber for grids/userSettings/etc.
  store.subscribe(
    debounce(() => {
      saveState(store.getState());
    }, 800)
  );

  // Hydrate persisted form drafts on boot. We dispatch *after* the store
  // exists so the slice has its initial state. Live forms (none at boot)
  // are not affected.
  if (typeof window !== 'undefined') {
    const loaded = loadDrafts();
    if (loaded.drafts.length > 0) {
      store.dispatch(
        formsActions.draftsHydrated({
          drafts: loaded.drafts,
          byId: loaded.byId,
        })
      );
    }
    // TODO(UTR-000140 follow-up): surface `loaded.evicted` to the UI as a
    // snackbar listing entityType so the user knows their old draft was
    // discarded. Phase 1 just drops them silently.
  }

  // Separate persistence subscriber for form drafts. Debounced so rapid
  // edits to a draft (rare — drafts are usually written once on dismiss)
  // don't thrash localStorage.
  store.subscribe(
    debounce(() => {
      const projection = selectPersistableDrafts(store.getState().forms);
      saveDrafts(projection.drafts, projection.byId);
    }, 800)
  );

  if (typeof window !== 'undefined') {
    (window as unknown as { __STORE__?: unknown }).__STORE__ = store;
  }

  return store;
}


type Store = ReturnType<typeof makeStore>;

export type AppDispatch = Store['dispatch'];

// For some reason this does not work need to explicitly sate ReturnType<Store['getState']>;
export type RootState = {
  grids: GridsState
  sideNav: SideNavState
  windows: WindowsState
  forms: FormsState
  optimisticRows: OptimisticRowsState
  recentlyOpened: RecentlyOpenedState
}

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export const wrapper = createWrapper(makeStore, { debug: true });
