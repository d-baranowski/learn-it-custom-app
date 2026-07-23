import {messages} from "@gen/factory";
import {WhereBuilder} from "~/request/where";

export interface Builder {
  build(): any;
}

export class BaseBuilder<K extends keyof typeof messages> {
  readonly _name: K;
  readonly _class: InstanceType<typeof messages[K]['class']>;
  readonly _interface: typeof messages[K]['interface'];
  wb = new WhereBuilder<K>();

  constructor(k: K) {
    const messageEntry = messages[k];
    if (!messageEntry) {
      throw new Error(`request builder called with invalid message key '${k}' not found`);
    }
    this._name = k;
    this._class = new messageEntry.class() as InstanceType<typeof messages[K]['class']>;
    this._interface = {} as typeof messages[K]['interface'];
  }

  class() {
    return this._class;
  }

  //classWithData(data: any) {
  //  return new messages[this._name].class(data);
  //}

  interface(): typeof messages[K]['interface'] {
    return this._interface;
  }

  interfaceKeys(): (keyof typeof messages[K]['interface'])[] {
    return Object.keys(this._interface) as (keyof typeof messages[K]['interface'])[];
  }

  byID(id: string) {
    this.wb.eq('ID' as any, id)
    return this
  }

  setWhere(wb: WhereBuilder<K>) {
    this.wb = wb
    return this
  }

  // removeWhere(id: string): void {
  //   this.wb.remove(id)
  // }

  resetWhere() {
    this.wb = new WhereBuilder<K>()
    return this
  }

  where(build: (builder: WhereBuilder<K>) => void, reset?: boolean) {
    if (reset) {
      this.resetWhere()
    }
    build(this.wb)
    return this
  }

  build() {
    throw new Error("Method not implemented.");
  }
}
