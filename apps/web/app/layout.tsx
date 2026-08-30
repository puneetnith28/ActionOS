import type { Metadata } from "next";
import { getRequestLocale, getRequestMessages } from "../lib/i18n-server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const copy = (await getRequestMessages()).metadata;
  return { title: copy.title, description: copy.description };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
