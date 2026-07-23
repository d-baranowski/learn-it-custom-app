import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'
import getToken from "~/auth/get-token";

function getNextLocale(cookieHeader: string | null): string {
  const cookies = cookieHeader?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  return cookies?.['NEXT_LOCALE'] || 'en';
}
export async function proxy(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie");
  const token = await getToken({
    cookieString: cookieHeader,
  })
  const locale = getNextLocale(cookieHeader) || 'en';

  if (!token) {
    const url = new URL(`/${locale}/auth/signin`, req.url);
    const pathname = new URL(req.url).pathname;
    if (pathname !== '/') {
      url.searchParams.set("callbackUrl", encodeURI(pathname));
    }
    return NextResponse.redirect(url);
  }

  // check if we're heading to / and if so redirect to /home-screen
  if (req.nextUrl.pathname === "/") {
    const url = new URL(`/${locale}/home-screen`, req.url);
    return NextResponse.redirect(url);
  }

  if (req.nextUrl.locale === 'default') {
    return NextResponse.redirect(
      new URL(`/${locale}${req.nextUrl.pathname}${req.nextUrl.search}`, req.url)
    )
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (data fetching and i18n files)
     * - favicon.ico (favicon file)
     * - public assets (wasm_exec.js, etc.)
     * - auth/* (auth routes)
     * - assets/* (static assets)
     * - dev-tools (no auth required)
     */
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|wasm_exec.js|.*\\.wasm|auth/|assets/|dev-tools).*)',
    '/',
  ],
}

export default proxy
