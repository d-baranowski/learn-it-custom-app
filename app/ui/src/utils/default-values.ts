import set from "lodash/set";
import {FieldInfo, Message} from '@bufbuild/protobuf';

const rpgDefaults = () => ({
  // In here you can provide application wide default values
  effectiveStart: BigInt(Date.now()),
});

function defaultValues<I extends Object & Message<I>>(input: I, constructor: { new(...args: any[]): Message<I>, fields: { findJsonName(i: string): FieldInfo | undefined } }): I {
  const d = rpgDefaults();

  // TODO this might not work in production beware due to minimised js variable names
  Object.entries(d).forEach(([key, defaultValue]) => {
    if (!!constructor.fields.findJsonName(key)) {
      set(input, key, defaultValue);
    }
  })

  return input;
}

export default defaultValues;
