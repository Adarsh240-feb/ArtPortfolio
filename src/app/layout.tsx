import type { Metadata } from "next";
import { Playfair_Display, Outfit, Caveat } from "next/font/google";
import "./globals.css";
import { PaletteProvider } from "@/context/PaletteContext";
import BrushstrokeCanvas from "@/components/canvas/BrushstrokeCanvas";
import Navbar from "@/components/layout/Navbar";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-handwritten",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Life of Ritik | Artworks",
  description: "An immersive, tactile digital space showcasing fine art collections, acrylic portraits, and mixed media creative studies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative select-none">
        <PaletteProvider>
          {/* Subtle paper noise overlay to create tactile realism */}
          <div className="paper-texture" />
          
          {/* Organic brushstroke background canvas */}
          <BrushstrokeCanvas />

          {/* Navigation Bar */}
          <Navbar />
          
          {/* Main App Content */}
          <div className="relative z-20 flex-1 flex flex-col pt-24">
            {children}
          </div>
        </PaletteProvider>
      </body>
    </html>
  );
}
