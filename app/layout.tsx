import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const displayFont = Sora({
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TCG Marketplace AR",
    template: "%s | TCG Marketplace AR",
  },
  description:
    "Pokemon-first marketplace para semi-vendedores de TCG en Argentina.",
  applicationName: "TCG Marketplace AR",
  openGraph: {
    title: "TCG Marketplace AR",
    description:
      "Inventario, listings y pagos verificados para vender cartas con confianza.",
    type: "website",
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
      data-theme="dark"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
