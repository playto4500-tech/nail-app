import type { Metadata, Viewport } from "next";
import "./globals.css";
import TopBar from "../components/TopBar";
import FloatingAddVisitButton from "../components/FloatingAddVisitButton";
import ZoomGuard from "../components/ZoomGuard";

export const metadata: Metadata = {
  applicationName: "Nail Studio Manager",
  title: "Nail Studio Manager",
  description: "Prosta aplikacja dla stylistki paznokci",
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "Nail Studio Manager",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8fafc",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <ZoomGuard />
        <TopBar />
        <main className="flex-1 bg-slate-50 pt-[4.5rem] pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        {modal}
        <FloatingAddVisitButton />
      </body>
    </html>
  );
}
