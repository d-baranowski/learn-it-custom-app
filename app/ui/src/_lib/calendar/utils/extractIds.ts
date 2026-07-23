/**
 * Extracts string IDs from an array of values that may be objects with an 'id' property or strings
 * @param value - Array of values to extract IDs from
 * @returns Array of string IDs
 */
export function extractIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  
  return value.map(v => 
    typeof v === 'object' && v !== null && 'id' in v 
      ? String(v.id) 
      : String(v)
  );
}
