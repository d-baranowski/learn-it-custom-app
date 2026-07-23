import {GRID_TOKEN_SEARCH_PARAM} from '~/_lib/grid/grid';

export const buildShareUrl = (currentHref: string, token: string): string => {
  const url = new URL(currentHref);
  url.searchParams.set(GRID_TOKEN_SEARCH_PARAM, token);
  return url.toString();
};
