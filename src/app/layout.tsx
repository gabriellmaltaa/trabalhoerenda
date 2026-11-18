import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-jakarta",
});

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-fraunces",
});

export const viewport: Viewport = {
  themeColor: "#0b2545",
};

export const metadata: Metadata = {
  title: "Trabalho & Renda | Portal de Oportunidades e Gestão CRM",
  description:
    "Portal digital e CRM profissional para organização de contatos, funil de oportunidades em reais, tarefas prioritárias e relatórios executivos.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
