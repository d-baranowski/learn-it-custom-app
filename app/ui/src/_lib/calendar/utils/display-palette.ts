import {
  cssColorToRgb,
  hslToRgb,
  rgbToCssRgbString,
  rgbToHsl,
} from '~/_lib/color/get-contrasting-color';

export interface DisplayPalette {
  accent: string;
  pillBg: string;
  pillText: string;
}

const NEUTRAL: DisplayPalette = {
  accent: '#C8C5B9',
  pillBg: '#F0EEE8',
  pillText: '#5F5E5A',
};

// Derive an accent bar, a light pill background and a dark pill text colour
// from a single display colour, keeping the pill legible on any hue.
export function getDisplayPalette(displayColor?: string): DisplayPalette {
  const rgb = displayColor ? cssColorToRgb(displayColor) : null;
  if (!rgb) return NEUTRAL;

  const [h, s] = rgbToHsl(rgb);
  return {
    accent: rgbToCssRgbString(rgb),
    pillBg: rgbToCssRgbString(hslToRgb([h, Math.min(s, 0.6), 0.9])),
    pillText: rgbToCssRgbString(
      hslToRgb([h, Math.min(Math.max(s, 0.35), 0.85), 0.3]),
    ),
  };
}
