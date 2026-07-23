import type { Middleware } from '@reduxjs/toolkit';
import { windowOpen, windowUpdateSize } from './windows-slice';

/**
 * Redux middleware:
 * - watches for `windows/windowOpen`
 * - waits for the matching Dialog2 DOM node to mount (via `data-window-id`)
 * - measures its initial on-screen size
 * - persists it to redux via `windowUpdateSize`
 *
 * This runs once per opened window id and only if the window doesn't already have a size.
 */
export const windowInitialSizeMiddleware: Middleware =
  (api) => (next) => (action) => {
    const result = next(action);
    // Only works client-side.
    if (typeof document === 'undefined') {
      return result;
    }

    if (!windowOpen.match(action)) {
      return result;
    }

    const windowId = action.payload.windowId;
    if (!windowId) {
      return result;
    }

    // Fast path: the slice now always pre-sets size at openWindow time, so
    // skip the DOM-measure dance entirely when size is already populated.
    const initial = (api.getState() as any)?.windows?.windows?.[windowId];
    if (initial?.size?.width && initial?.size?.height) {
      return result;
    }

    window.setTimeout(() => {
      const selector = `[data-window-id="${windowId}"]`;
      const maxAttempts = 20;
      const delayMs = 50;

      const attemptMeasure = (attempt: number) => {
        // If size already exists, don't touch it.
        const existing = (api.getState() as any)?.windows?.windows?.[windowId];
        if (existing?.size?.width && existing?.size?.height) {
          return;
        }

        const el = document.querySelector<HTMLElement>(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          const width = Math.round(rect.width);
          const height = Math.round(rect.height);

          if (width > 0 && height > 0) {
            api.dispatch(
              windowUpdateSize({ windowId, size: { width, height } }),
            );
            return;
          }
        }

        if (attempt < maxAttempts) {
          window.setTimeout(() => attemptMeasure(attempt + 1), delayMs);
        }
      };

      // Let React commit the Dialog2 mount first.
      window.requestAnimationFrame(() => attemptMeasure(0));
    }, 100);

    return result;
  };
