"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface PaletteContextType {
  accentColor: string;
  setPaletteFromColor: (hexColor: string) => void;
  resetPalette: () => void;
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined);

const DEFAULT_ACCENT = "#dfae6f"; // Warm Champagne/Bronze
const DEFAULT_BG_START = "#23201d"; // Softer warm charcoal (15% lightness)
const DEFAULT_BG_END = "#161412"; // Deep warm charcoal (9% lightness)

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);

  const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
    hex = hex.replace(/^#/, "");
    // Support 3-digit hex values
    if (hex.length === 3) {
      hex = hex.split("").map(char => char + char).join("");
    }
    const num = parseInt(hex, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  };

  const setPaletteFromColor = (hexColor: string) => {
    try {
      const { h, s, l } = hexToHsl(hexColor);
      
      // Compute vibrant accent (high saturation and medium lightness)
      const accent = hslToHex(h, Math.max(s, 75), Math.max(l, 55));
      // Softer dark background start using the hue (15% lightness)
      const bgStart = hslToHex(h, Math.min(s, 22), 15);
      // Softer dark background end (9% lightness)
      const bgEnd = hslToHex(h, Math.min(s, 14), 9);

      setAccentColor(accent);

      // Set global document variables
      document.documentElement.style.setProperty("--accent-color", accent);
      document.documentElement.style.setProperty("--bg-gradient-start", bgStart);
      document.documentElement.style.setProperty("--bg-gradient-end", bgEnd);
    } catch (e) {
      console.error("Error setting palette color:", e);
    }
  };

  const resetPalette = () => {
    setAccentColor(DEFAULT_ACCENT);
    document.documentElement.style.setProperty("--accent-color", DEFAULT_ACCENT);
    document.documentElement.style.setProperty("--bg-gradient-start", DEFAULT_BG_START);
    document.documentElement.style.setProperty("--bg-gradient-end", DEFAULT_BG_END);
  };

  return (
    <PaletteContext.Provider value={{ accentColor, setPaletteFromColor, resetPalette }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error("usePalette must be used within a PaletteProvider");
  }
  return context;
}
