import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trabalho e Renda | CRM",
  description: "Base de desenvolvimento do CRM TRABALHOERENDA.COM.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
