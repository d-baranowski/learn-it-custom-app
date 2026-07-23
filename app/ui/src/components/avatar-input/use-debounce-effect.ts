import {DependencyList, useEffect} from "react";

export function useDebounceEffect(
  fn: () => void,
  waitTime: number,
  deps?: DependencyList,
) {
  useEffect(() => {
    const t = setTimeout(() => {
      // @ts-ignore       // eslint-disable-next-line prefer-spread
      fn.apply(undefined, deps);
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
    // The whole point of this hook is forwarding caller-provided deps;
    // statically the linter can't verify them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
