import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Alegreya_Sans } from "next/font/google";
import "./globals.css";
import { DiceProvider } from "@/contexts";
import { DiceEngineControls } from "@/components/DiceEngineControls";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const alegreyaSans = Alegreya_Sans({
  variable: "--font-alegreya-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "House of Shadows | Character Creator",
  description: "Create your dark fantasy character for House of Shadows RPG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${alegreyaSans.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider>
          <DiceProvider>
            {children}
            <DiceEngineControls />
          </DiceProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
