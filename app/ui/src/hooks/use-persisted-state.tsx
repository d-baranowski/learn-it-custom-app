import {useEffect, useState} from "react";

function usePersistedState<T = any>(defaultValue: T, stateName: string): [T, (value: T) => void, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const localStorageState = window.localStorage.getItem(stateName)

    if (localStorageState) {
      setValue(JSON.parse(localStorageState))
    }

    setIsLoading(false);
  }, [stateName])

  const wrappedSetValue = (value: T) => {
    if (isLoading) {
      return
    }

    setValue(value)
    window.localStorage.setItem(stateName, JSON.stringify(value))
  }

  return [value, wrappedSetValue, (value: T) => { window.localStorage.setItem(stateName, JSON.stringify(value))}, isLoading];
}

export default usePersistedState
