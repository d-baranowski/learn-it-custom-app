import {toggleAccordion, setAccordionState, closeAllAccordions, setSearchQuery, setExpandedBySearch, SideNavReducer, SideNavState} from './side-nav-slice';
import {expect} from '@jest/globals';

describe('sideNavSlice', () => {
  it('should toggle accordion state from false to true', () => {
    const initialState: SideNavState = {
      accordionStates: {
        'Attendance': false,
      },
      searchQuery: '',
      expandedBySearch: [],
    };

    const action = toggleAccordion({ itemTitle: 'Attendance' });
    const newState = SideNavReducer(initialState, action);

    expect(newState.accordionStates['Attendance']).toEqual(true);
  });

  it('should toggle accordion state from true to false', () => {
    const initialState: SideNavState = {
      accordionStates: {
        'Attendance': true,
      },
      searchQuery: '',
      expandedBySearch: [],
    };

    const action = toggleAccordion({ itemTitle: 'Attendance' });
    const newState = SideNavReducer(initialState, action);

    expect(newState.accordionStates['Attendance']).toEqual(false);
  });

  it('should set accordion state to open', () => {
    const initialState: SideNavState = {
      accordionStates: {},
      searchQuery: '',
      expandedBySearch: [],
    };

    const action = setAccordionState({ itemTitle: 'Organisation', isOpen: true });
    const newState = SideNavReducer(initialState, action);

    expect(newState.accordionStates['Organisation']).toEqual(true);
  });

  it('should set accordion state to closed', () => {
    const initialState: SideNavState = {
      accordionStates: {
        'Settings': true,
      },
      searchQuery: '',
      expandedBySearch: [],
    };

    const action = setAccordionState({ itemTitle: 'Settings', isOpen: false });
    const newState = SideNavReducer(initialState, action);

    expect(newState.accordionStates['Settings']).toEqual(false);
  });

  it('should close all accordions', () => {
    const initialState: SideNavState = {
      accordionStates: {
        'Attendance': true,
        'Organisation': true,
        'Settings': true,
      },
      searchQuery: '',
      expandedBySearch: [],
    };

    const action = closeAllAccordions();
    const newState = SideNavReducer(initialState, action);

    expect(newState.accordionStates).toEqual({});
  });

  it('should handle toggle for non-existent accordion (undefined to true)', () => {
    const initialState: SideNavState = {
      accordionStates: {},
      searchQuery: '',
      expandedBySearch: [],
    };

    const action = toggleAccordion({ itemTitle: 'User Management' });
    const newState = SideNavReducer(initialState, action);

    expect(newState.accordionStates['User Management']).toEqual(true);
  });

  it('should set search query', () => {
    const initialState: SideNavState = {
      accordionStates: {},
      searchQuery: '',
      expandedBySearch: [],
    };

    const action = setSearchQuery('customer');
    const newState = SideNavReducer(initialState, action);

    expect(newState.searchQuery).toEqual('customer');
  });

  it('should set expanded by search items', () => {
    const initialState: SideNavState = {
      accordionStates: {},
      searchQuery: '',
      expandedBySearch: [],
    };

    const action = setExpandedBySearch(['User Management', 'Settings']);
    const newState = SideNavReducer(initialState, action);

    expect(newState.expandedBySearch).toEqual(['User Management', 'Settings']);
  });
});
