import {gridInitialise, GridsReducer, GridsState} from './grids-slice';
import {CountryGrid} from "@gen/grids";
import {expect} from '@jest/globals';
import {WhereOperator} from "@gen/request/v1/base_pb";

describe('gridsSlice - gridInitialise action', () => {
  it('should correctly initialize grid state with the given payload', () => {
    const initialState: GridsState = {
      byName: {}, views: {}
    }

    const action = gridInitialise({
      "grid": CountryGrid
    });
    const newState = GridsReducer(initialState, action);

    expect(newState.byName["Country"].columns[0].id).toEqual("id");
    expect(newState.byName["Country"].columns[0].header).toEqual("Id");
    expect(newState.byName["Country"].columns[0].type).toEqual("string");
    expect(newState.byName["Country"].columns[0].visible).toEqual(false);
    expect(newState.byName["Country"].columns[0].cellRendererType).toEqual(undefined);
    expect(newState.byName["Country"].columns[0].accessorKey).toEqual("id");
  });

  it('should correctly initialize grid filters', () => {
    const initialState: GridsState = {
      byName: {}, views: {}
    }

    const action = gridInitialise({
      "grid": CountryGrid
    });
    const newState = GridsReducer(initialState, action);

    expect(newState.byName["Country"].filters).toEqual([]);
  });

  it('should setup the override filters if they are being passed in the payload of the action', () => {
    const initialState: GridsState = {
      byName: {}, views: {}
    }

    const action = gridInitialise({
      grid: CountryGrid,
      overrideFilters: [
        {
          id: 'id',
          value: "123",
          operator: WhereOperator.EQ
        }
      ]
    });
    const newState = GridsReducer(initialState, action);

    expect(newState.byName["Country"].filters[0].id).toEqual("id");
    expect(newState.byName["Country"].filters[0].operator).toEqual(WhereOperator.EQ);
    expect(newState.byName["Country"].filters[0].value).toEqual("123");
    expect(newState.byName["Country"].overrideFilters[0].id).toEqual("id");
    expect(newState.byName["Country"].overrideFilters[0].operator).toEqual(WhereOperator.EQ);
    expect(newState.byName["Country"].overrideFilters[0].value).toEqual("123");
  })
});
