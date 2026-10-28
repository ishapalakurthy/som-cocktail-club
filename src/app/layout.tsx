import type { Metadata } from "next";
import { Geist_Mono, Lato, Newsreader } from "next/font/google";
import "./globals.css";

const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["300", "400", "700"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "SOM Cocktail Club",
  description: "Sign up for SOM Cocktail Club events",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${lato.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
