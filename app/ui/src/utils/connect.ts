import {createConnectTransport} from "@connectrpc/connect-web";
import {createRegistry} from "@bufbuild/protobuf";
import type {Interceptor} from "@connectrpc/connect";

/**
 * Get the current language from various sources
 * Priority: NEXT_LOCALE cookie > localStorage > navigator language > default 'en'
 */
function getCurrentLanguage(): string {
  if (typeof window === 'undefined') {
    return 'en';
  }

  // Check NEXT_LOCALE cookie first (set by language picker)
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const nextLocale = cookies['NEXT_LOCALE'];
  if (nextLocale) {
    return nextLocale;
  }

  // Check localStorage (used by next-i18next)
  const storedLang = localStorage.getItem('i18nextLng');
  if (storedLang) {
    return storedLang;
  }

  // Check navigator language as fallback
  const navigatorLang = navigator.language?.split('-')[0];
  if (navigatorLang) {
    return navigatorLang;
  }

  return 'en';
}

// Interceptor to add Accept-Language header based on current locale
const languageInterceptor: Interceptor = (next) => async (req) => {
  const language = getCurrentLanguage();

  console.log(`Setting X-I18Next-Lng header to: ${language}`);
  // Add the Accept-Language header to the request
  req.header.set('X-I18Next-Lng', language);

  return await next(req);
};

export const ConnectTransport = createConnectTransport({
    baseUrl: '/api/rpc',
    jsonOptions: {
      typeRegistry: createRegistry(
        //Account,
      )
    },
    credentials: 'include',
    interceptors: [languageInterceptor],
  })
;
