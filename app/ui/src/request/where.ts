import {
  Where,
  Where_Clause,
  Where_Condition,
  Where_Mode,
  Where_SubQuery,
  WhereOperator,
} from '@gen/request/v1/base_pb';
import { Builder } from '~/request/builder';
import { WhereFieldPath } from '~/request/types';
import { Timestamp } from '@bufbuild/protobuf';
import { messages } from '@gen/factory';
import { getId } from '~/utils/id';

type WhereClauseValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | boolean[]
  | Date[]
  | null
  | Timestamp;
type WhereBuilderChildren<K extends keyof typeof messages> = (
  | WhereBuilder<K>
  | WhereClauseBuilder<K>
)[];

export class WhereBuilder<K extends keyof typeof messages> implements Builder {
  public id = '';
  private __type = 'WhereBuilder';
  mode: Where_Mode = Where_Mode.AND; //private
  children: WhereBuilderChildren<K> = []; //private

  setMode(mode: Where_Mode): WhereBuilder<K> {
    this.mode = mode;
    return this;
  }

  constructor(build?: (builder: WhereBuilder<K>) => void) {
    build && build(this);
    return this;
  }

  clause(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    operator: WhereOperator,
    value: any,
    id?: string,
  ): WhereBuilder<K> {
    const cb = new WhereClauseBuilder<K>();
    cb.id = id || getId();
    // check if id existing and remove it
    this.remove(cb.id);
    cb.where(field, operator, value);
    this.children.push(cb);
    return this;
  }

  eq(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.EQ, value);
  }

  neq(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.NEQ, value);
  }

  in(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.COL_IN_VAL, value);
  }

  nin(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.COL_NIN_VAL, value);
  }

  lt(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.LT, value);
  }

  lte(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.LTE, value);
  }

  gt(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.GT, value);
  }

  gte(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.GTE, value);
  }

  between(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    valueA: WhereClauseValue,
    valueB: WhereClauseValue,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.BETWEEN, [valueA, valueB]);
  }

  isnull(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.ISNULL, null);
  }

  notnull(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
  ): WhereBuilder<K> {
    return this.clause(field, WhereOperator.NOTNULL, null);
  }

  startswith(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
    insensitive: boolean = true,
  ): WhereBuilder<K> {
    return this.clause(
      field,
      insensitive ? WhereOperator.ISTARTSWITH : WhereOperator.STARTSWITH,
      value,
    );
  }

  endswith(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
    insensitive: boolean = true,
  ): WhereBuilder<K> {
    return this.clause(
      field,
      insensitive ? WhereOperator.IENDSWITH : WhereOperator.ENDSWITH,
      value,
    );
  }

  like(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
    insensitive: boolean = true,
  ): WhereBuilder<K> {
    return this.clause(
      field,
      insensitive ? WhereOperator.ILIKE : WhereOperator.LIKE,
      value,
    );
  }

  notlike(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    value: WhereClauseValue,
    insensitive: boolean = true,
  ): WhereBuilder<K> {
    return this.clause(
      field,
      insensitive ? WhereOperator.NILIKE : WhereOperator.NLIKE,
      value,
    );
  }

  group(
    build: (builder: WhereBuilder<K>) => void,
    id?: string,
  ): WhereBuilder<K> {
    const wb = new WhereBuilder<K>();
    wb.id = id || getId();
    build(wb);
    this.children.push(wb);
    return this;
  }

  get(id: string): WhereBuilder<K> | WhereClauseBuilder<K> | undefined {
    return this.children.find((c) => c.id === id);
  }

  remove(id: string): void {
    this.children = this.children.filter((c) => c.id !== id);
  }

  hydrate(data: any) {
    const parsed = WhereBuilder.parse(data);
    this.id = parsed.id;
    this.mode = parsed.mode;
    this.children = parsed.children as unknown as WhereBuilderChildren<K>;
  }

  static parse(data: any) {
    const result = new WhereBuilder();
    result.id = data.id;
    result.mode = data.mode;
    result.children = data.children
      .map((child: any) => {
        if (child?.__type === 'WhereClauseBuilder') {
          return WhereClauseBuilder.parse(child);
        } else if (child?.__type === 'WhereBuilder') {
          return WhereBuilder.parse(child);
        } else {
          return null;
        }
      })
      .filter((c: any) => c != null);

    return result;
  }

  build(): Where {
    const w = new Where();
    w.mode = this.mode;
    w.conditions = this.children
      .map((c) => toWhereCondition(c.build()))
      .filter((c) => c != null) as Where_Condition[];
    return w;
  }

  string(): string {
    return JSON.stringify(this.build());
  }
}

export class WhereClauseBuilder<K extends keyof typeof messages> {
  public id = '';
  private __type = 'WhereClauseBuilder';
  private field = '';
  private operator = WhereOperator.EQ;
  private value: WhereClauseValue = '';

  where(
    field: WhereFieldPath<(typeof messages)[K]['interface']>,
    operator: WhereOperator,
    value: WhereClauseValue,
  ): void {
    this.field = field as string;
    this.value = value;
    this.operator = operator;
  }

  build(): Where_Clause {
    return new Where_Clause({
      field: this.field,
      operator: this.operator,
      value: JSON.stringify(
        Array.isArray(this.value) ? this.value : [this.value],
      ),
    });
  }

  getValue() {
    return this.value;
  }

  getOperator() {
    return this.operator;
  }

  static parse(data: any) {
    const result = new WhereClauseBuilder();
    result.id = data.id;
    result.field = data.field;
    result.operator = data.operator;
    result.value = data.value;
    return result;
  }
}

export function toWhereCondition(
  v: Where | Where_Clause | Where_SubQuery,
): Where_Condition | null {
  const switchType = v.getType().typeName;
  if (switchType.toString() == Where.typeName.toString()) {
    return new Where_Condition({
      condition: {
        value: v as Where,
        case: 'group',
      },
    });
  }
  if (switchType.toString() == Where_Clause.typeName.toString()) {
    return new Where_Condition({
      condition: {
        value: v as Where_Clause,
        case: 'clause',
      },
    });
  }
  if (switchType.toString() == Where_SubQuery.typeName.toString()) {
    return new Where_Condition({
      condition: {
        value: v as Where_SubQuery,
        case: 'subQuery',
      },
    });
  }
  console.log("Unknown where condition type:", switchType);
  return null;
}
