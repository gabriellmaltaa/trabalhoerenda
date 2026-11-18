import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trabalho e Renda | CRM",
  description: "Organize contatos, oportunidades e tarefas no CRM Trabalho e Renda.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
