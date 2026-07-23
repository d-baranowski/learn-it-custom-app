import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '~/_lib/grid/state/store';

export const useGridDispatch = () => useDispatch<AppDispatch>();
export const useGridSelector: TypedUseSelectorHook<RootState> = useSelector;
