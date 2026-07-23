import {Timestamp} from "@bufbuild/protobuf";
import {OrderDirection} from "@gen/request/v1/base_pb";

type IsTimestamp<T> =
  NonNullable<T> extends Timestamp
    ? true
    : false;

// type NonFunctionKeys<T> = {
//   [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
// }[keyof T];

type NonFunctionKeys<T> = {
  [K in keyof T]-?: T[K] extends Function ? never : K
}[keyof T] & string;

export type OrderByField<T> = {
  field: SelectFieldPath<T>
  direction: OrderDirection
}

// export type SelectFieldPath<T> =
//   | {
//   [K in NonFunctionKeys<T> & string]:
//   IsTimestamp<T[K]> extends true
//     ? K // Stop here if it is a Timestamp or nullable Timestamp
//     : T[K] extends any[]
//       ? T[K] extends Array<infer U>
//         ? U extends object ? K | `${K}.${SelectFieldPath<U>}` : K
//         : never
//       : T[K] extends object | undefined
//         ? K | `${K}.${SelectFieldPath<NonNullable<T[K]>>}`
//         : K
// }[NonFunctionKeys<T> & string];

export type SelectFieldPath<T> = {
  [K in keyof T & string]: T[K] extends Function ? never // Exclude functions
    : IsTimestamp<T[K]> extends true ? K // Stop if it is a Timestamp or nullable Timestamp
      : T[K] extends any[] ? K // Stop if it is an array
        : T[K] extends object ? K // Stop if it is an object (including null/undefined checks)
          : K // Include primitive types directly
}[keyof T & string];


// export type WhereFieldPath<T> = {
//   [K in NonFunctionKeys<T> & string]:
//   IsTimestamp<T[K]> extends true
//     ? K // Stop recursion if it is a Timestamp, including nullable Timestamps
//     : T[K] extends any[]
//       ? T[K] extends Array<infer U>
//         ? U extends object ? `${K}.${WhereFieldPath<U>}` : K
//         : never
//       : T[K] extends object | undefined
//         ? `${K}.${WhereFieldPath<NonNullable<T[K]>>}`
//         : K
// }[NonFunctionKeys<T> & string];

export type WhereFieldPath<T, Prefix extends string = ''> = {
  [K in NonFunctionKeys<T>]:
  IsTimestamp<T[K]> extends true
    ? never // If you still want to include timestamps, change this to Prefix extends '' ? K : `${Prefix}.${K}`
    : T[K] extends any[]
      ? never // Assuming you don't want array indices in your paths, change as needed
      : T[K] extends object | undefined
        ? WhereFieldPath<NonNullable<T[K]>, (Prefix extends '' ? '' : `${Prefix}.`) | K>
        : (Prefix extends '' ? K : `${Prefix}.${K}`)
}[NonFunctionKeys<T>];
