import {Message} from '@bufbuild/protobuf';
import {PaginationResponse} from '@gen/request/v1/base_pb';

export interface GenericListResponse<ItemType> extends Message<GenericListResponse<ItemType>> {
  items: ItemType[],
  pagination?: PaginationResponse | undefined
}
