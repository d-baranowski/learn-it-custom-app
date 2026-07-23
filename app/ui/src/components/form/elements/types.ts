/**
 * Shared constants for form/autocomplete elements.
 *
 * The legacy types.ts also exported `RpgElementBaseProps` and
 * `RpgAutocompleteProps`; both vanished with the legacy elements that
 * required `control` to be passed in. The new elements read formId from
 * `<FormContext>` and don't need a shared base interface.
 */

import {
  AutocompleteRequest,
  OrderBy,
  OrderDirection,
} from '@gen/request/v1/base_pb';

export const DefaultAutocompleteOrder = [
  new OrderBy({ field: 'label', direction: OrderDirection.ASC }),
];

export const DefaultAutocompleteRequest = new AutocompleteRequest({
  order: DefaultAutocompleteOrder,
});
