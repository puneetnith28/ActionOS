import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, localizePath, type Locale } from "./lib/i18n";

function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get("dueback-locale")?.value;
  if (isLocale(saved)) return saved;
  const languages = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (languages.includes("pt")) return "pt";
  if (languages.includes("es")) return "es";
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const candidate = pathname.split("/")[1];
  if (!isLocale(candidate)) {
    const target = request.nextUrl.clone();
    target.pathname = localizePath(pathname, preferredLocale(request));
    return NextResponse.redirect(target);
  }

  const locale = candidate;
  const target = request.nextUrl.clone();
  target.pathname = pathname.slice(locale.length + 1) || "/";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-dueback-locale", locale);
  const response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  response.cookies.set("dueback-locale", locale, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax", path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"]
};
