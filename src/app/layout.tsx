import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/wallets/wallet-context";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-jetbrains-mono"
});

export const metadata: Metadata = {
  title: "XRPL Email - Decentralized Email for XRPL Ecosystem",
  description: "Send and receive emails using XRPL addresses. Secure, decentralized communication built on the XRP Ledger.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${jetbrainsMono.variable} antialiased`}>
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}