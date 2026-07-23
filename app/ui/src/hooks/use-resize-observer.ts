import {useEffect, useRef} from 'react';

interface Props {
  onResizeObserved: (elementRef: React.MutableRefObject<HTMLElement | null>, resizeObserverEntry: ResizeObserverEntry) => void;
}

function useResizeObserver(props: Props) {
  const { onResizeObserved } = props;
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Capture the current ref so the cleanup function unobserves the same
    // element we were observing (the ref may have been re-assigned by the
    // time cleanup runs).
    const observed = elementRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        onResizeObserved(elementRef, entries[0]);
      }
    });

    if (observed) {
      resizeObserver.observe(observed);
    }

    return () => {
      if (observed) {
        resizeObserver.unobserve(observed);
      }
      resizeObserver.disconnect();
    };
  }, [onResizeObserved]);

  return { ref: elementRef };
}

export default useResizeObserver;
