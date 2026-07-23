export function isUndefined<T>(value: T | undefined): value is undefined {
  return typeof value === 'undefined'
}

export function isDefined<T>(t: T | null | undefined): t is T {
  return t !== null && t !== undefined;
}

export type NullableProps<T> = {
  [K in keyof T]: T[K] | null;
};

export function nullPropsToUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return undefined as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(nullPropsToUndefined) as unknown as T;
  }

  if (typeof obj === 'object') {
    const newObj: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      newObj[key] = nullPropsToUndefined(value);
    });
    return newObj;
  }

  return obj === null ? undefined as unknown as T : obj;
}


export type OmitMetaData<T> = Omit<
  T,
  "createdAt" | "updatedAt" | "deletedAt" | "createdBy" | "updatedBy" | "deletedBy" | "createdByName" |
  "createdByEmail" | "updatedByName" | "updatedByEmail" |  "deletedByName" | "deletedByEmail"
>;

export type OmitAuditFields<T> = Omit<T,
  'createdAt' | 'createdBy' | 'createdByUser' |
  'updatedAt' | 'updatedBy' | 'updatedByUser' |
  'deletedAt' | 'deletedBy' | 'deletedByUser'
>;

export type RequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};

export type DeepKeys<T, TDepth extends any[] = []> = TDepth['length'] extends 5
  ? never
  : unknown extends T
    ? string
    : object extends T
      ? string
      : T extends readonly any[] & IsTuple<T>
        ? AllowedIndexes<T> | DeepKeysPrefix<T, AllowedIndexes<T>, TDepth>
        : T extends any[]
          ? DeepKeys<T[number], [...TDepth, any]>
          : T extends Date
            ? never
            : T extends object
              ? (keyof T & string) | DeepKeysPrefix<T, keyof T, TDepth>
              : never

type ComputeRange<
  N extends number,
  Result extends Array<unknown> = [],
> = Result['length'] extends N
  ? Result
  : ComputeRange<N, [...Result, Result['length']]>
type Index40 = ComputeRange<40>[number]

// Is this type a tuple?
type IsTuple<T> = T extends readonly any[] & { length: infer Length }
  ? Length extends Index40
    ? T
    : never
  : never

// If this type is a tuple, what indices are allowed?
type AllowedIndexes<
  Tuple extends ReadonlyArray<any>,
  Keys extends number = never,
> = Tuple extends readonly []
  ? Keys
  : Tuple extends readonly [infer _, ...infer Tail]
    ? AllowedIndexes<Tail, Keys | Tail['length']>
    : Keys


type DeepKeysPrefix<
  T,
  TPrefix,
  TDepth extends any[],
> = TPrefix extends keyof T & (number | string)
  ? `${TPrefix}.${DeepKeys<T[TPrefix], [...TDepth, any]> & string}`
  : never

export type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>

export type IntRange<F extends number, T extends number> = F extends T ?
  F :
  Exclude<Enumerate<T>, Enumerate<F>> extends never ?
    never :
    Exclude<Enumerate<T>, Enumerate<F>> | T
