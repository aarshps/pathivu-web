import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { ServiceWorker } from "@/components/ServiceWorker";

// Rounded, friendly face approximating the native "Google Sans Flex" (Android)
// and SF Rounded (iOS). `ui-rounded` in the CSS stack still wins on Apple.
const rounded = Nunito({
  variable: "--font-rounded",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Pathivu",
  description: "Build good habits, quit bad ones — synced across your devices.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Pathivu" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Blocking theme script: applies the saved theme before paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('pathivu-theme');if(t==='dark'||t==='light'){document.documentElement.classList.add(t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${rounded.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <AppProvider>{children}</AppProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
