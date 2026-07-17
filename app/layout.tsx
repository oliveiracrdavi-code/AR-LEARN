import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Altamente Rentável Academy",
  description:
    "Altamente Rentável Academy — videoaulas, Ebooks e mapas mentais gerados a partir do podcast Altamente Rentável (mercado imobiliário).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
