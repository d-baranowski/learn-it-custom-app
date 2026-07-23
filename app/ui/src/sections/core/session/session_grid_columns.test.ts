import { describe, it, expect } from '@jest/globals';
import { SessionGrid } from '@gen/grids';

// The id column (cancelledByUserId) and the label column (cancelledByUserLabel)
// previously both derived the header "Cancelled By User", so the column showed
// up twice in the Show/Hide list. The id column carries an explicit
// "Cancelled By User Id" header override in session.proto to disambiguate.
describe('SessionGrid columns', () => {
  it('gives cancelledByUserId and cancelledByUserLabel distinct headers', () => {
    const idCol = SessionGrid.columns.find((c) => c.id === 'cancelledByUserId');
    const labelCol = SessionGrid.columns.find(
      (c) => c.id === 'cancelledByUserLabel'
    );

    expect(idCol).toBeDefined();
    expect(labelCol).toBeDefined();
    expect(idCol!.header).not.toBe(labelCol!.header);
  });
});
