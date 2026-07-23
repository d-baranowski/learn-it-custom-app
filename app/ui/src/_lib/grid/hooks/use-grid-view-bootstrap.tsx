import React from 'react';
import {useRouter} from 'next/router';
import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import {viewSetActive} from '~/_lib/grid/state/grids-slice';
import {GRID_TOKEN_SEARCH_PARAM} from '~/_lib/grid/grid';

/**
 * Runs ONCE per grid page mount to apply the view-precedence rules:
 * URL token > favourite view > last active. The favourite wins over the
 * persisted last-active because "favourite" semantically means "load this
 * on visit", and a page reload is a fresh visit.
 *
 * Must be called from the page level (not inside `useGridView`), otherwise
 * every consumer that mounts later (e.g. the view popover) would re-fire
 * the bootstrap and undo a user's explicit "Reset view" within a session.
 */
function useGridViewBootstrap(gridName: string) {
  const router = useRouter();
  const dispatch = useGridDispatch();
  const views = useGridSelector(s => s?.grids?.views?.[gridName]);
  const didBootstrapRef = React.useRef(false);

  React.useEffect(() => {
    if (didBootstrapRef.current) return;
    if (!views) return;
    if (router.query?.[GRID_TOKEN_SEARCH_PARAM]) {
      didBootstrapRef.current = true;
      return;
    }
    const favourite = views.find(v => v.isFavourite);
    if (favourite && !favourite.isActive) {
      dispatch(viewSetActive({gridName, viewName: favourite.viewName}));
    }
    didBootstrapRef.current = true;
  }, [views, router.query, dispatch, gridName]);
}

export default useGridViewBootstrap;
