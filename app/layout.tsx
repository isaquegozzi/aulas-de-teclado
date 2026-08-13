import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aulas de Teclado",
  description: "Gerenciador de aulas de teclado: agenda, alunos, materiais e pagamentos",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} antialiased`} style={{ background: "var(--background)", color: "var(--text-primary)" }}>
        {session ? (
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-60">
              <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
                {children}
              </div>
            </main>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}