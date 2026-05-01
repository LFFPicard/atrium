import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSetting } from "@/lib/settings";
import { themes, defaultTheme, themeToCSS, ThemeVars } from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Atrium',
  description: 'Your self-hosted homelab portal',
  icons: {
  icon: '/favicon.svg',
  apple: '/icon.svg',
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeId = getSetting<string>('theme_preset');
  const overrides = getSetting<Partial<ThemeVars>>('theme_overrides');
  const theme = themes.find((t) => t.id === themeId) ?? defaultTheme;
  const themeCSS = themeToCSS(theme.vars, overrides ?? undefined);

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
