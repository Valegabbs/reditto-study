import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reditto Study",
  description: "Plataforma de estudo com IA para tirar dúvidas",
    icons: {
    icon: [
      { url: '/assets/logo.PNG?v=2', type: 'image/png' },
    ],
    shortcut: ['/assets/logo.PNG?v=2'],
    apple: ['/assets/logo.PNG?v=2'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
