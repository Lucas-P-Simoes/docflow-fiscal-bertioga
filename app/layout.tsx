import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fiscal Bertioga",
  description:
    "Crie pareceres técnicos, Estudos Técnicos Preliminares, Termos de Referência e documentos oficiais em Word direto do navegador.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
