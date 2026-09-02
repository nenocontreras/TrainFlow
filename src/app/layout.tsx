import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Títulos y cifras: robusta, atlética (sistema de diseño "Forge").
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "TrainFlow",
    template: "%s · TrainFlow",
  },
  description: "Coaching de entrenamiento físico: planes, ejecución y progreso.",
  applicationName: "TrainFlow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrainFlow",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#151513" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
