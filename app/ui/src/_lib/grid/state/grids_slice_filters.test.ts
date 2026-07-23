import {filtersClear, filterSet, getInitialGridState, GridsReducer, GridsState} from './grids-slice';
import {expect} from '@jest/globals';
import {WhereOperator} from "@gen/request/v1/base_pb";

function stateWithGrid(overrides: Partial<ReturnType<typeof getInitialGridState>> = {}): GridsState {
  return {
    byName: {
      'TestGrid': {
        ...getInitialGridState(),
        initialised: true,
        ...overrides,
      },
    },
    views: {},
  };
}

describe('gridsSlice - filter actions', () => {
  it('should add a filter using filterSet', () => {
    const initialState = stateWithGrid();

    const action = filterSet({
      gridName: 'TestGrid',
      id: 'name',
      operator: WhereOperator.LIKE,
      value: 'test'
    });
    const newState = GridsReducer(initialState, action);

    expect(newState.byName['TestGrid'].filters).toHaveLength(1);
    expect(newState.byName['TestGrid'].filters[0].id).toEqual('name');
    expect(newState.byName['TestGrid'].filters[0].operator).toEqual(WhereOperator.LIKE);
    expect(newState.byName['TestGrid'].filters[0].value).toEqual('test');
  });

  it('should clear all filters using filtersClear', () => {
    const initialState = stateWithGrid({
      filters: [
        { id: 'name', operator: WhereOperator.LIKE, value: 'test' },
        { id: 'age', operator: WhereOperator.GT, value: 18 }
      ],
    });

    const action = filtersClear({ gridName: 'TestGrid' });
    const newState = GridsReducer(initialState, action);

    expect(newState.byName['TestGrid'].filters).toHaveLength(0);
  });

  it('should not add filter when value is empty', () => {
    const initialState = stateWithGrid();

    const action = filterSet({
      gridName: 'TestGrid',
      id: 'name',
      operator: WhereOperator.LIKE,
      value: ''
    });
    const newState = GridsReducer(initialState, action);

    expect(newState.byName['TestGrid'].filters).toHaveLength(0);
  });
});
