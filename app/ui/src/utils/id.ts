import {nanoid} from "nanoid";

export const getId = () => `${nanoid()}`;

export const getIdWithPrefix = (prefix: string, length?: number) => {
  if (length === undefined) (
    length = 27
  )

  // subtract the length of the prefix from the length
  length = length - prefix.length - 1;
  const id = nanoid(length);
  return `${prefix}-${id}`;
}

export const existingId = (id?: string) => {
  if (!id) return false;
  return !id.startsWith("NEW-")
}

export const newId = () => {
  return getIdWithPrefix("NEW");
}
