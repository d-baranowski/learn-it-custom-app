import enLocale from '../../public/locales/en/common.json';
import plLocale from '../../public/locales/pl/common.json';

const locales: Record<string, Record<string, string>> = { en: enLocale, pl: plLocale };
let activeLanguage = 'en';

export function setTestLanguage(lang: string) {
  activeLanguage = lang;
}

export function getTestLanguage(): string {
  return activeLanguage;
}

export function translate(key: string, opts?: Record<string, unknown>): string {
  const dict = locales[activeLanguage] ?? locales.en;
  let text = dict[key] ?? key;
  if (opts) {
    text = text.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts[k] ?? ''));
  }
  return text;
}

export function mockNextI18next() {
  return {
    useTranslation: () => ({
      t: (key: string, opts?: Record<string, unknown>) => translate(key, opts),
      i18n: { get language() { return activeLanguage; } },
    }),
  };
}
