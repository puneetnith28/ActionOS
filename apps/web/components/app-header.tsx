import { getRequestLocale, getRequestMessages } from "../lib/i18n-server";
import { localizePath } from "../lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

export async function AppHeader() {
  const [locale, messages] = await Promise.all([getRequestLocale(), getRequestMessages()]);
  const copy = messages.header;
  return (
    <header className="app-header">
      <a className="brand" href={localizePath("/", locale)} aria-label={copy.home}>
        <span className="brand-mark" aria-hidden="true">⌘</span>
        <span>ActionOS</span>
      </a>
      <nav className="header-actions" aria-label={copy.navigation}>
        <a className="header-link" href={localizePath("/cases", locale)}>{copy.cases}</a>
        <a className="header-link" href={localizePath("/privacy", locale)}>{copy.privacy}</a>
        <LanguageSwitcher />
        <a className="header-cta" href={localizePath("/intake", locale)}>{copy.try}</a>
      </nav>
    </header>
  );
}
