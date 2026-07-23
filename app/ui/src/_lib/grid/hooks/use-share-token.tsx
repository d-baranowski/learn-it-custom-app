import {useEffect} from 'react';
import {useRouter} from 'next/router';
import {GRID_TOKEN_SEARCH_PARAM} from '~/_lib/grid/grid';
import {useGridDispatch} from '~/_lib/grid/state/hooks';
import {tokenDecode, viewSetActive} from '../state/grids-slice';

function useShareToken(name: string) {
  const router = useRouter();
  const { query: urlQuery, pathname } = router;
  const token = urlQuery[GRID_TOKEN_SEARCH_PARAM] as string | undefined;
  const dispatch = useGridDispatch();

  useEffect(() => {
    if (token && name) {
      //load shared state and disable persistence
      dispatch(viewSetActive({ gridName: name, viewName: '' }));
      dispatch(tokenDecode({ name: name, token }));
      const newParams = new URLSearchParams(urlQuery as any);
      newParams.delete(GRID_TOKEN_SEARCH_PARAM);
      void router.replace(
        { pathname, query: newParams.toString() },
        undefined,
        { shallow: true },
      );
    }
  }, [token, name, dispatch, pathname, router, urlQuery]);
}

export default useShareToken;
