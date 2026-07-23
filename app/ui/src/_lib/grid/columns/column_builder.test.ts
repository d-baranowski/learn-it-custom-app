import {columnBuilder} from './column_builder';
import {Grid as GeneratedGrid, CountryGrid} from '@gen/grids';
import {expect} from '@jest/globals';

describe('columnBuilder', () => {
  it('should generate the boolean column correctly', () => {
    const mockGrid: GeneratedGrid = {
      name: 'testGrid',
      columns: [
        {id: 'exampleBoolean', type: 'boolean', enum: false, header: 'Boolean', visible: true},
      ],
      filters: [],
    };

    const result = columnBuilder(mockGrid);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual("exampleBoolean");
    expect(result[0].type).toEqual("boolean");
    expect(result[0].visible).toEqual(true);
    expect(result[0].cellRendererType).toEqual("boolean");
    expect(result[0].accessorKey).toEqual("exampleBoolean");
  });

  it('generate invisible column directly', () => {
    const mockGrid: GeneratedGrid = {
      name: 'testGrid',
      columns: [
        {id: 'exampleBoolean', type: 'boolean', enum: false, header: 'Boolean', visible: false},
      ],
      filters: [],
    };

    const result = columnBuilder(mockGrid);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual("exampleBoolean");
    expect(result[0].type).toEqual("boolean");
    expect(result[0].visible).toEqual(false);
    expect(result[0].cellRendererType).toEqual("boolean");
    expect(result[0].accessorKey).toEqual("exampleBoolean");
  });

  it('should generate correct columns for the country grid', () => {
    const result = columnBuilder(CountryGrid);

    expect(result).toHaveLength(15);

    expect(result[0].id).toEqual("id");
    expect(result[0].header).toEqual("Id");
    expect(result[0].type).toEqual("string");
    expect(result[0].visible).toEqual(false);

    expect(result[1].id).toEqual("iso2");
    expect(result[1].header).toEqual("Iso2");
    expect(result[1].type).toEqual("string");
    expect(result[1].visible).toEqual(true);

    expect(result[2].id).toEqual("iso3");
    expect(result[2].header).toEqual("Iso3");
    expect(result[2].type).toEqual("string");
    expect(result[2].visible).toEqual(true);

    expect(result[3].id).toEqual("name");
    expect(result[3].header).toEqual("Name");
    expect(result[3].type).toEqual("string");
    expect(result[3].visible).toEqual(true);

    expect(result[4].id).toEqual("nationalityName");
    expect(result[4].header).toEqual("Nationality");
    expect(result[4].type).toEqual("string");
    expect(result[4].visible).toEqual(true);

    expect(result[5].id).toEqual("timezone");
    expect(result[5].header).toEqual("Timezone");
    expect(result[5].type).toEqual("string");
    expect(result[5].visible).toEqual(true);

    expect(result[6].id).toEqual("createdAt");
    expect(result[6].header).toEqual("Created At");
    expect(result[6].type).toEqual("bigint");
    expect(result[6].visible).toEqual(false);

    expect(result[7].id).toEqual("createdBy");
    expect(result[7].header).toEqual("Created By Id");
    expect(result[7].type).toEqual("string");
    expect(result[7].visible).toEqual(false);

    expect(result[8].id).toEqual("createdByLabel");
    expect(result[8].header).toEqual("Created By");
    expect(result[8].type).toEqual("string");
    expect(result[8].visible).toEqual(false);

    expect(result[9].id).toEqual("updatedAt");
    expect(result[9].header).toEqual("Updated At");
    expect(result[9].type).toEqual("bigint");
    expect(result[9].visible).toEqual(false);

    expect(result[10].id).toEqual("updatedBy");
    expect(result[10].header).toEqual("Updated By Id");
    expect(result[10].type).toEqual("string");
    expect(result[10].visible).toEqual(false);

    expect(result[11].id).toEqual("updatedByLabel");
    expect(result[11].header).toEqual("Updated By");
    expect(result[11].type).toEqual("string");
    expect(result[11].visible).toEqual(false);

    expect(result[12].id).toEqual("deletedAt");
    expect(result[12].header).toEqual("Deleted At");
    expect(result[12].type).toEqual("bigint");
    expect(result[12].visible).toEqual(false);

    expect(result[13].id).toEqual("deletedBy");
    expect(result[13].header).toEqual("Deleted By Id");
    expect(result[13].type).toEqual("string");
    expect(result[13].visible).toEqual(false);

    expect(result[14].id).toEqual("deletedByLabel");
    expect(result[14].header).toEqual("Deleted By");
    expect(result[14].type).toEqual("string");
    expect(result[14].visible).toEqual(false);
  })
});
