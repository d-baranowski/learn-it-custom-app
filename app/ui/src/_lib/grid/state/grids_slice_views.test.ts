import {expect} from '@jest/globals';
import {GridsReducer, GridsState, getInitialGridState, gridReset, viewAdd, viewSetActive, viewSetFavourite, viewDuplicate} from './grids-slice';
import {encode} from '~/_lib/grid/encode';

const baseState = (views: GridsState['views'] = {}): GridsState => ({
  byName: {'TestGrid': getInitialGridState()},
  views,
});

const seedView = (overrides: Partial<GridsState['views'][string][number]> = {}) => ({
  viewName: 'A',
  isActive: false,
  autoSave: false,
  gridState: '()',
  ...overrides,
});

describe('gridsSlice - view default/duplicate actions', () => {
  it('viewSetFavourite marks the target as default and clears others', () => {
    const state = baseState({
      'TestGrid': [
        seedView({viewName: 'A', isFavourite: true}),
        seedView({viewName: 'B'}),
      ],
    });

    const next = GridsReducer(state, viewSetFavourite({gridName: 'TestGrid', viewName: 'B'}));

    expect(next.views['TestGrid']).toEqual([
      expect.objectContaining({viewName: 'A', isFavourite: false}),
      expect.objectContaining({viewName: 'B', isFavourite: true}),
    ]);
  });

  it('viewSetFavourite toggles off when called on the current default', () => {
    const state = baseState({
      'TestGrid': [seedView({viewName: 'A', isFavourite: true})],
    });

    const next = GridsReducer(state, viewSetFavourite({gridName: 'TestGrid', viewName: 'A'}));

    expect(next.views['TestGrid'][0].isFavourite).toBe(false);
  });

  it('viewDuplicate creates a sibling copy with the same encoded state', () => {
    const state = baseState({
      'TestGrid': [seedView({viewName: 'A', isActive: true, autoSave: true, gridState: '(x:1)'})],
    });

    const next = GridsReducer(state, viewDuplicate({gridName: 'TestGrid', viewName: 'A'}));

    expect(next.views['TestGrid']).toHaveLength(2);
    expect(next.views['TestGrid'][1]).toEqual(expect.objectContaining({
      viewName: 'A (copy)',
      isActive: false,
      autoSave: false,
      isFavourite: false,
      gridState: '(x:1)',
    }));
    // original untouched
    expect(next.views['TestGrid'][0]).toEqual(expect.objectContaining({viewName: 'A', isActive: true, autoSave: true}));
  });

  it('viewDuplicate increments suffix when the copy name collides', () => {
    const state = baseState({
      'TestGrid': [
        seedView({viewName: 'A', gridState: '(x:1)'}),
        seedView({viewName: 'A (copy)'}),
      ],
    });

    const next = GridsReducer(state, viewDuplicate({gridName: 'TestGrid', viewName: 'A'}));

    expect(next.views['TestGrid'].map(v => v.viewName)).toEqual(['A', 'A (copy)', 'A (copy 2)']);
  });

  it('viewAdd preserves isFavourite when re-activating siblings', () => {
    const state = baseState({
      'TestGrid': [seedView({viewName: 'A', isFavourite: true, isActive: true})],
    });

    const next = GridsReducer(state, viewAdd({gridName: 'TestGrid', viewName: 'B'}));

    const a = next.views['TestGrid'].find(v => v.viewName === 'A')!;
    expect(a.isFavourite).toBe(true);
    expect(a.isActive).toBe(false);
  });

  it('gridReset preserves mrt-row-select at the front of columnOrder', () => {
    const state = baseState();
    state.byName['TestGrid'].columnOrder = ['mrt-row-select', 'a', 'b'];
    state.byName['TestGrid'].baseColumnOrder = ['a', 'b'];

    const next = GridsReducer(state, gridReset({name: 'TestGrid'}));

    expect(next.byName['TestGrid'].columnOrder).toEqual(['mrt-row-select', 'a', 'b']);
  });

  it('gridReset clears filters but keeps overrideFilters', () => {
    const state = baseState();
    state.byName['TestGrid'].filters = [
      {id: 'name', value: 'alice', operator: 0},
      {id: 'parent', value: 't1', operator: 0},
    ];
    state.byName['TestGrid'].overrideFilters = [
      {id: 'parent', value: 't1', operator: 0},
    ];

    const next = GridsReducer(state, gridReset({name: 'TestGrid'}));

    expect(next.byName['TestGrid'].filters).toEqual([
      {id: 'parent', value: 't1', operator: 0},
    ]);
  });

  it('viewSetActive re-injects live display columns when applying a saved order', () => {
    const savedGridState = encode({
      ...getInitialGridState(),
      columnOrder: ['a', 'b'],
    });
    const state = baseState({
      'TestGrid': [seedView({viewName: 'V', gridState: savedGridState})],
    });
    state.byName['TestGrid'].columnOrder = ['mrt-row-select', 'x'];

    const next = GridsReducer(state, viewSetActive({gridName: 'TestGrid', viewName: 'V'}));

    expect(next.byName['TestGrid'].columnOrder).toEqual(['mrt-row-select', 'a', 'b']);
  });

  it('viewAdd with fromBase snapshots the grid base layout, not live state', () => {
    const state = baseState({});
    state.byName['TestGrid'].baseColumnOrder = ['x', 'y'];
    state.byName['TestGrid'].baseColumnVisibility = {x: true, y: false};
    state.byName['TestGrid'].columnOrder = ['y', 'x'];
    state.byName['TestGrid'].columnVisibility = {x: false, y: true};

    const next = GridsReducer(state, viewAdd({gridName: 'TestGrid', viewName: 'Base', fromBase: true}));

    const saved = next.views['TestGrid'][0];
    expect(saved.gridState).toContain('x'); // base order is x,y
    // current ('y','x') should not be what got saved
    expect(saved.gridState).not.toEqual(
      GridsReducer(state, viewAdd({gridName: 'TestGrid', viewName: 'Live'})).views['TestGrid'][0].gridState,
    );
  });
});
