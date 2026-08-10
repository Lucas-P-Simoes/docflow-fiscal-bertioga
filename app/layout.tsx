import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocFlow — Assistente de Documentos",
  description:
    "Crie relatórios fotográficos e folhas de cota em Word direto do navegador.",
  icons: {
    icon: "/docflow/assets/og.png",
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
