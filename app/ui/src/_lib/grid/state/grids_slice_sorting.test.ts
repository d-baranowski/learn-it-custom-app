import { GridsReducer, gridInitialise, sortingChange, getInitialGridState } from './grids-slice';

const fakeGrid = {
  name: 'TestGrid',
  columns: [
    { id: 'id', enum: false, header: 'Id', type: 'string', visible: false },
    { id: 'date', enum: false, header: 'Date', type: 'string', visible: true, filterField: 'date' },
    { id: 'roomLabel', enum: false, header: 'Room', type: 'string', visible: true, filterField: 'roomId' },
  ],
  filters: [],
};

function initGrid() {
  let state = GridsReducer(undefined, { type: '@@INIT' });
  state = GridsReducer(state, gridInitialise({ grid: fakeGrid as any }));
  return state;
}

describe('grids-slice sorting', () => {
  it('initialises with empty sorting', () => {
    const state = initGrid();
    expect(state.byName.TestGrid.sorting).toEqual([]);
  });

  it('sets sorting on a column', () => {
    let state = initGrid();
    state = GridsReducer(state, sortingChange({
      name: 'TestGrid',
      sorting: [{ id: 'date', desc: false }],
    }));
    expect(state.byName.TestGrid.sorting).toEqual([{ id: 'date', desc: false }]);
  });

  it('replaces sorting when clicking a different column', () => {
    let state = initGrid();
    state = GridsReducer(state, sortingChange({
      name: 'TestGrid',
      sorting: [{ id: 'date', desc: false }],
    }));
    state = GridsReducer(state, sortingChange({
      name: 'TestGrid',
      sorting: [{ id: 'roomLabel', desc: false }],
    }));
    expect(state.byName.TestGrid.sorting).toEqual([{ id: 'roomLabel', desc: false }]);
  });

  it('toggles sort direction', () => {
    let state = initGrid();
    state = GridsReducer(state, sortingChange({
      name: 'TestGrid',
      sorting: [{ id: 'date', desc: false }],
    }));
    state = GridsReducer(state, sortingChange({
      name: 'TestGrid',
      sorting: [{ id: 'date', desc: true }],
    }));
    expect(state.byName.TestGrid.sorting).toEqual([{ id: 'date', desc: true }]);
  });

  it('clears sorting (third click)', () => {
    let state = initGrid();
    state = GridsReducer(state, sortingChange({
      name: 'TestGrid',
      sorting: [{ id: 'date', desc: false }],
    }));
    state = GridsReducer(state, sortingChange({
      name: 'TestGrid',
      sorting: [],
    }));
    expect(state.byName.TestGrid.sorting).toEqual([]);
  });

  it('does not affect a non-existent grid', () => {
    let state = initGrid();
    state = GridsReducer(state, sortingChange({
      name: 'NonExistent',
      sorting: [{ id: 'date', desc: false }],
    }));
    expect(state.byName.TestGrid.sorting).toEqual([]);
    expect(state.byName.NonExistent).toBeUndefined();
  });
});
