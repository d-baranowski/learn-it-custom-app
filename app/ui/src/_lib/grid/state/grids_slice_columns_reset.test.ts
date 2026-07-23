import {expect} from '@jest/globals';
import {GridsReducer, GridsState, getInitialGridState, columnsReset} from './grids-slice';

const seededState = (): GridsState => {
  const grid = getInitialGridState();
  grid.initialised = true;
  grid.columnOrder = ['mrt-row-select', 'c', 'a', 'b'];
  grid.baseColumnOrder = ['a', 'b', 'c'];
  grid.columnVisibility = {a: false, b: true, c: false};
  grid.baseColumnVisibility = {a: true, b: true, c: true};
  grid.filters = [{id: 'a', value: 1, operator: 0 as any}];
  grid.sorting = [{id: 'a', desc: true}];
  grid.pagination = {pageIndex: 3, pageSize: 50};
  return {byName: {TestGrid: grid}, views: {}};
};

describe('gridsSlice - columnsReset', () => {
  it('restores visibility and order to base, re-injecting display columns', () => {
    const next = GridsReducer(seededState(), columnsReset({name: 'TestGrid'}));
    const grid = next.byName.TestGrid;

    expect(grid.columnOrder).toEqual(['mrt-row-select', 'a', 'b', 'c']);
    expect(grid.columnVisibility).toEqual({a: true, b: true, c: true});
  });

  it('leaves filters, sorting and pagination untouched', () => {
    const next = GridsReducer(seededState(), columnsReset({name: 'TestGrid'}));
    const grid = next.byName.TestGrid;

    expect(grid.filters).toEqual([{id: 'a', value: 1, operator: 0}]);
    expect(grid.sorting).toEqual([{id: 'a', desc: true}]);
    expect(grid.pagination).toEqual({pageIndex: 3, pageSize: 50});
  });

  it('does not copy the base visibility object by reference', () => {
    const state = seededState();
    const next = GridsReducer(state, columnsReset({name: 'TestGrid'}));
    expect(next.byName.TestGrid.columnVisibility).not.toBe(
      next.byName.TestGrid.baseColumnVisibility,
    );
  });

  it('is a no-op for an unknown grid', () => {
    const next = GridsReducer(seededState(), columnsReset({name: 'Missing'}));
    expect(next.byName.Missing).toBeUndefined();
  });
});
