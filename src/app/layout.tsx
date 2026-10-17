// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./provider";
import "~/css/globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NAVSA — National Adopted Village for Smart Agriculture",
  description:
    "Smart agriculture management platform connecting organizations, farmers, suppliers, and IoT networks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}