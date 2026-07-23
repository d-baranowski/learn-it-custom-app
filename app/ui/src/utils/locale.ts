import enGB from 'date-fns/locale/en-GB';
import pl from 'date-fns/locale/pl';
import vi from 'date-fns/locale/vi';
import { useRouter } from 'next/router';

export type DateFnsLocale = typeof enGB;

export const dateFnsLocaleMap: Record<string, DateFnsLocale> = {
  en: enGB,
  pl: pl,
  vi: vi,
};

export function getDateFnsLocale(locale: string | undefined): DateFnsLocale {
  return dateFnsLocaleMap[locale ?? 'en'] ?? enGB;
}

export function useDateFnsLocale(): DateFnsLocale {
  const router = useRouter();
  return getDateFnsLocale(router.locale);
}

/**
 * Returns the locale's short date format as a MUI-compatible format string.
 * date-fns locales may use the single `y` token (calendar year) which MUI
 * doesn't expand to 4 digits — we normalise it to `yyyy`.
 */
export function getLocaleDateFormat(locale: DateFnsLocale): string {
  const fmt = locale.formatLong?.date({ width: 'short' }) ?? 'dd/MM/yyyy';
  return fmt.replace(/\by\b/g, 'yyyy');
}

/** Returns a locale-aware date + 24h time format string for MUI DateTimePicker. */
export function getLocaleDateTimeFormat(locale: DateFnsLocale): string {
  return `${getLocaleDateFormat(locale)} HH:mm`;
}

/** Hook version — derives the short date format for the active locale. */
export function useLocaleDateFormat(): string {
  return getLocaleDateFormat(useDateFnsLocale());
}

/** Hook version — derives the short date+time format for the active locale. */
export function useLocaleDateTimeFormat(): string {
  return getLocaleDateTimeFormat(useDateFnsLocale());
}
