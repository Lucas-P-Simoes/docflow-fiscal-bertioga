import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fiscal Bertioga — Assistente de Documentos",
  description:
    "Crie pareceres técnicos e documentos oficiais em Word direto do navegador.",
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
