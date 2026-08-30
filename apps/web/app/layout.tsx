import type { Metadata } from "next";
import { getRequestLocale, getRequestMessages } from "../lib/i18n-server";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const copy = (await getRequestMessages()).metadata;
  return { title: copy.title, description: copy.description };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale} className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
