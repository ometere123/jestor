import type { Metadata } from "next";
import { Rubik_Mono_One, DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/jestora/walletContext";

const rubikMonoOne = Rubik_Mono_One({
  weight: "400",
  variable: "--font-rubik-mono-one",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jestor — GenLayer Meme Balance Arena",
  description:
    "Jestor is a GenLayer-native arena where jokes, captions, roasts, and chaos actions mutate internal toy balances through transparent Intelligent Contract verdicts.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${rubikMonoOne.variable} ${dmSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-[#FFF8E7] text-[#121212] antialiased">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
