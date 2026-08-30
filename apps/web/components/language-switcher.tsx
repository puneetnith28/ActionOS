"use client";

import { usePathname } from "next/navigation";
import { getMessages, isLocale, localizePath, type Locale } from "../lib/i18n";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const current = pathname.split("/")[1];
  const locale: Locale = isLocale(current) ? current : "en";
  const copy = getMessages(locale).language;

  return (
    <label className="language-switcher">
      <span className="sr-only">{copy.label}</span>
      <select
        aria-label={copy.label}
        value={locale}
        onChange={(event) => {
          const next = event.target.value as Locale;
          document.cookie = `actionos-locale=${next}; Max-Age=31536000; Path=/; SameSite=Lax`;
          window.location.assign(localizePath(pathname, next));
        }}
      >
        <option value="en">{copy.en}</option>
        <option value="es">{copy.es}</option>
        <option value="pt">{copy.pt}</option>
      </select>
    </label>
  );
}
