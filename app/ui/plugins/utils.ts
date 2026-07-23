import {DescEnum, DescFile, DescMessage, getExtension, hasExtension, ScalarType} from "@bufbuild/protobuf";
import {ts_file_ignore} from "../gen/api/v1/generators_pb";

export function resolveScalarType(t: number): string {
  switch (t) {
    case ScalarType.DOUBLE:
    case ScalarType.FLOAT:
    case ScalarType.INT32:
    case ScalarType.FIXED32:
    case ScalarType.UINT32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32:
      return 'number';
    case ScalarType.INT64:
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      return 'bigint';
    case ScalarType.BOOL:
      return 'boolean';
    case ScalarType.STRING:
      return 'string';
    case ScalarType.BYTES:
      return 'Uint8Array';
    default:
      return 'any';
  }
}

export function resolveZodValidatorType(t: number): string {
  switch (t) {
    case ScalarType.DOUBLE:
    case ScalarType.FLOAT:
    case ScalarType.INT32:
    case ScalarType.FIXED32:
    case ScalarType.UINT32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32:
      return 'z.coerce.number()';
    case ScalarType.INT64:
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      return 'z.coerce.bigint()';
    case ScalarType.BOOL:
      return 'z.coerce.boolean()';
    case ScalarType.STRING:
      return 'z.string()';
    case ScalarType.BYTES:
      return 'z.instance(Uint8Array)';
    default:
      return 'z.any()';
  }
}

export function messageName(m: DescMessage) {
  let name = m.name
  while (m.parent) {
    name = m.parent.name + "_" + name
    m = m.parent
  }
  return name
}

export function interfaceName(m: DescMessage) {
  return "I" + messageName(m)
}

export function enumName(e: DescEnum) {
  let name = e.name
  let parent = e.parent
  while (parent) {
    name = parent.name + "_" + name
    parent = parent.parent
  }
  return name
}

export function fileIgnored(e: DescFile) {
  if (e.proto.options && hasExtension(e.proto.options, ts_file_ignore)) {
    return getExtension(e.proto.options, ts_file_ignore)
  }
  return false
}
