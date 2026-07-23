import {isArray, isPlainObject, mapValues} from "lodash";

function nullToUndefined<T = unknown>(value: T): typeof value {
  if (isPlainObject(value)) {
    return mapValues(value as object, nullToUndefined) as T
  }
  if (isArray(value)) {
    return value.map(nullToUndefined) as T
  }
  if (value === null || value === "") {
    return undefined as T
  }
  return value
}

export default nullToUndefined
