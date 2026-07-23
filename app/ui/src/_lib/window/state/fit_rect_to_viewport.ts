export type Rect = { x: number; y: number; width: number; height: number };
export type Viewport = { width: number; height: number };

export const SAFE_MARGIN = 8;
export const MIN_WIDTH = 360;
export const MIN_HEIGHT = 200;

export function fitRectToViewport(rect: Rect, viewport: Viewport): Rect {
  const maxW = Math.max(MIN_WIDTH, viewport.width - 2 * SAFE_MARGIN);
  const maxH = Math.max(MIN_HEIGHT, viewport.height - 2 * SAFE_MARGIN);

  const width = Math.min(rect.width, maxW);
  const height = Math.min(rect.height, maxH);

  let x = rect.x;
  let y = rect.y;
  if (x + width > viewport.width - SAFE_MARGIN) {
    x = viewport.width - SAFE_MARGIN - width;
  }
  if (y + height > viewport.height - SAFE_MARGIN) {
    y = viewport.height - SAFE_MARGIN - height;
  }
  x = Math.max(SAFE_MARGIN, x);
  y = Math.max(SAFE_MARGIN, y);

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export function getViewportSize(): Viewport {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 800 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}
