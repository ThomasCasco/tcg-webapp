import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TCG Market — Cartas Pokémon",
    template: "%s · TCG Market",
  },
  description:
    "Comprá y vendé cartas de Pokémon con precios sugeridos, reputación y seguimiento de cada operación.",
  applicationName: "TCG Market",
  openGraph: {
    title: "TCG Market — Cartas Pokémon",
    description:
      "Comprá y vendé cartas de Pokémon con confianza: inventario, publicaciones y seguimiento de pagos.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
