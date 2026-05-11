import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const displayFont = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TCG.ar - Marketplace de Pokemon TCG en Argentina",
    template: "%s | TCG.ar",
  },
  description:
    "Compra, vende y tradea cartas Pokemon TCG en Argentina. Precios en pesos, pagos con Mercado Pago, envio o retiro.",
  applicationName: "TCG.ar",
  keywords: ["pokemon", "tcg", "cartas", "marketplace", "argentina", "mercado pago", "trading cards"],
  openGraph: {
    title: "TCG.ar - Marketplace de Pokemon TCG en Argentina",
    description:
      "El marketplace de cartas Pokemon para coleccionistas en Argentina. Compra, vende y tradea con confianza.",
    type: "website",
    locale: "es_AR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased bg-[var(--color-surface)]`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
