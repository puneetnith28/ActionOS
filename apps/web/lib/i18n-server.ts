import "server-only";
import { headers } from "next/headers";
import { defaultLocale, getMessages, isLocale, type Locale } from "./i18n";

export async function getRequestLocale(): Promise<Locale> {
  const value = (await headers()).get("x-actionos-locale") ?? undefined;
  return isLocale(value) ? value : defaultLocale;
}

export async function getRequestMessages() {
  return getMessages(await getRequestLocale());
}
