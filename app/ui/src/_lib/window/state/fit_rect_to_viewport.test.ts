import { describe, it, expect } from '@jest/globals';
import { fitRectToViewport, SAFE_MARGIN, MIN_WIDTH, MIN_HEIGHT } from './fit_rect_to_viewport';

const VP = { width: 1280, height: 800 };

describe('fitRectToViewport', () => {
  it('leaves a fully-contained rect unchanged', () => {
    const rect = { x: 100, y: 100, width: 400, height: 300 };
    expect(fitRectToViewport(rect, VP)).toEqual(rect);
  });

  it('shrinks width that exceeds the viewport', () => {
    const rect = { x: 50, y: 100, width: 2000, height: 300 };
    const out = fitRectToViewport(rect, VP);
    expect(out.width).toBe(VP.width - 2 * SAFE_MARGIN);
    expect(out.x).toBe(SAFE_MARGIN);
    expect(out.height).toBe(300);
  });

  it('shrinks height that exceeds the viewport — the Sessions-tab case', () => {
    const rect = { x: 100, y: 50, width: 400, height: 2000 };
    const out = fitRectToViewport(rect, VP);
    expect(out.height).toBe(VP.height - 2 * SAFE_MARGIN);
    expect(out.y).toBe(SAFE_MARGIN);
    expect(out.width).toBe(400);
  });

  it('shifts a rect that overhangs the right edge without shrinking', () => {
    const rect = { x: 1200, y: 100, width: 400, height: 300 };
    const out = fitRectToViewport(rect, VP);
    expect(out.width).toBe(400);
    expect(out.x + out.width).toBe(VP.width - SAFE_MARGIN);
  });

  it('shifts a rect that overhangs the bottom edge without shrinking', () => {
    const rect = { x: 100, y: 700, width: 400, height: 300 };
    const out = fitRectToViewport(rect, VP);
    expect(out.height).toBe(300);
    expect(out.y + out.height).toBe(VP.height - SAFE_MARGIN);
  });

  it('clamps negative positions to the safe margin', () => {
    const rect = { x: -50, y: -200, width: 400, height: 300 };
    const out = fitRectToViewport(rect, VP);
    expect(out.x).toBe(SAFE_MARGIN);
    expect(out.y).toBe(SAFE_MARGIN);
  });

  it('shrink-then-shift: a rect both larger and offset still ends fully inside', () => {
    const rect = { x: 900, y: 600, width: 2000, height: 2000 };
    const out = fitRectToViewport(rect, VP);
    expect(out.x).toBe(SAFE_MARGIN);
    expect(out.y).toBe(SAFE_MARGIN);
    expect(out.width).toBe(VP.width - 2 * SAFE_MARGIN);
    expect(out.height).toBe(VP.height - 2 * SAFE_MARGIN);
  });

  it('respects minimum size when the viewport is tiny (degenerate, allows overflow)', () => {
    const tinyVp = { width: 200, height: 150 };
    const rect = { x: 0, y: 0, width: 400, height: 400 };
    const out = fitRectToViewport(rect, tinyVp);
    expect(out.width).toBe(MIN_WIDTH);
    expect(out.height).toBe(MIN_HEIGHT);
  });

  it('is idempotent', () => {
    const rect = { x: 1200, y: 700, width: 600, height: 600 };
    const once = fitRectToViewport(rect, VP);
    const twice = fitRectToViewport(once, VP);
    expect(twice).toEqual(once);
  });

  it('rounds to integer pixels', () => {
    const rect = { x: 10.7, y: 20.3, width: 400.9, height: 300.1 };
    const out = fitRectToViewport(rect, VP);
    expect(Number.isInteger(out.x)).toBe(true);
    expect(Number.isInteger(out.y)).toBe(true);
    expect(Number.isInteger(out.width)).toBe(true);
    expect(Number.isInteger(out.height)).toBe(true);
  });
});
