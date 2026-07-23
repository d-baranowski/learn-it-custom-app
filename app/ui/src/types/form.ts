import {Message} from '@bufbuild/protobuf';

export type Optional<T, K extends (keyof T)[]> = Pick<Partial<T>, K[number]> & Omit<T, K[number]>;

export class GetMessage extends Message<GetMessage> {
  ID: string = '';
}
