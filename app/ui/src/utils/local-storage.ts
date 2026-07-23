export function clearLocalStorageWithPrefix(prefix: string) {
  const keys = Object.keys(localStorage);

  for (const key of keys) {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
}