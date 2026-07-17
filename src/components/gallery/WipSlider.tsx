"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MoveHorizontal, Sparkles } from "lucide-react";

interface WipSliderProps {
  title: string;
  images: string[]; // Array of image URLs: [sketch, underpainting, final]
}

export default function WipSlider({ title, images }: WipSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for single slider (2 images)
  const [singlePct, setSinglePct] = useState(50);
  
  // State for double slider (3 images)
  const [p1, setP1] = useState(33);
  const [p2, setP2] = useState(66);
  
  // Active handle dragging tracking
  const [dragging, setDragging] = useState<null | "single" | "p1" | "p2">(null);

  // Fallback if no images provided
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-neutral-900 flex items-center justify-center text-white/40">
        No images available
      </div>
    );
  }

  // If only 1 image, render standard image
  if (images.length === 1) {
    return (
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-white/5 shadow-2xl">
        <Image
          src={images[0]}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover"
        />
      </div>
    );
  }

  // Pointer move dragging handlers
  const handlePointerDown = (handleType: "single" | "p1" | "p2") => (e: React.PointerEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    
    container.setPointerCapture(e.pointerId);
    setDragging(handleType);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      let pct = (x / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));

      if (handleType === "single") {
        setSinglePct(pct);
      } else if (handleType === "p1") {
        if (pct < p2 - 8) {
          setP1(pct);
        }
      } else if (handleType === "p2") {
        if (pct > p1 + 8) {
          setP2(pct);
        }
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      container.releasePointerCapture(upEvent.pointerId);
      setDragging(null);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Helper labels for the steps
  const getStepLabel = (idx: number) => {
    if (images.length === 2) {
      return idx === 0 ? "Initial Draft" : "Completed Masterpiece";
    }
    if (idx === 0) return "Initial Sketch";
    if (idx === 1) return "Underpainting";
    return "Finished Piece";
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Interactive Canvas Slider Container */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-neutral-950 select-none touch-none"
      >
        
        {/* Render 2 Images comparison layout */}
        {images.length === 2 && (
          <>
            {/* Base layer: Sketch */}
            <div className="absolute inset-0">
              <Image
                src={images[0]}
                alt="Sketch process"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
              <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded text-[10px] font-sans text-white/70 border border-white/5 uppercase tracking-wider">
                {getStepLabel(0)}
              </div>
            </div>

            {/* Top layer: Final (clipped) */}
            <div 
              className="absolute inset-0"
              style={{
                clipPath: `polygon(0 0, ${singlePct}% 0, ${singlePct}% 100%, 0 100%)`
              }}
            >
              <Image
                src={images[1]}
                alt="Final Piece"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
              <div className="absolute top-4 right-4 px-2.5 py-1 bg-accent/90 backdrop-blur-md rounded text-[10px] font-sans text-black font-semibold uppercase tracking-wider">
                {getStepLabel(1)}
              </div>
            </div>

            {/* Slider Divider Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-accent/80 cursor-ew-resize flex items-center justify-center transition-opacity duration-300"
              style={{ left: `${singlePct}%` }}
              onPointerDown={handlePointerDown("single")}
            >
              <div className={`w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg border border-white/30 transform -translate-x-1/2 cursor-ew-resize transition-transform duration-200 ${dragging === "single" ? "scale-110" : "scale-100"}`}>
                <MoveHorizontal className="w-4 h-4 text-black" />
              </div>
            </div>
          </>
        )}

        {/* Render 3 Images comparison layout */}
        {images.length >= 3 && (
          <>
            {/* Layer 0 (Bottom): Sketch - Visible on the left */}
            <div className="absolute inset-0">
              <Image
                src={images[0]}
                alt="Initial Sketch"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
              <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded text-[10px] font-sans text-white/70 border border-white/5 uppercase tracking-wider">
                {getStepLabel(0)}
              </div>
            </div>

            {/* Layer 1 (Middle): Underpainting - Visible in middle (clipped between p1 and 100%) */}
            <div 
              className="absolute inset-0"
              style={{
                clipPath: `polygon(${p1}% 0, 100% 0, 100% 100%, ${p1}% 100%)`
              }}
            >
              <Image
                src={images[1]}
                alt="Underpainting layer"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
              <div 
                className="absolute top-4 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded text-[10px] font-sans text-white/70 border border-white/5 uppercase tracking-wider"
                style={{ left: `${Math.max(p1 + 2, (p1 + p2)/2 - 10)}%` }}
              >
                {getStepLabel(1)}
              </div>
            </div>

            {/* Layer 2 (Top): Final - Visible on the right (clipped between p2 and 100%) */}
            <div 
              className="absolute inset-0"
              style={{
                clipPath: `polygon(${p2}% 0, 100% 0, 100% 100%, ${p2}% 100%)`
              }}
            >
              <Image
                src={images[2]}
                alt="Final Masterpiece"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
              <div className="absolute top-4 right-4 px-2.5 py-1 bg-accent/90 backdrop-blur-md rounded text-[10px] font-sans text-black font-semibold uppercase tracking-wider">
                {getStepLabel(2)}
              </div>
            </div>

            {/* Handle 1 (p1) */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/40 hover:bg-accent/80 cursor-ew-resize flex items-center justify-center transition-all duration-300"
              style={{ left: `${p1}%` }}
              onPointerDown={handlePointerDown("p1")}
            >
              <div className={`w-7 h-7 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center shadow-md transform -translate-x-1/2 cursor-ew-resize transition-all duration-200 hover:border-accent ${dragging === "p1" ? "scale-115 border-accent bg-accent" : "scale-100"}`}>
                <span className={`text-[9px] font-bold ${dragging === "p1" ? "text-black" : "text-white/70"}`}>1</span>
              </div>
            </div>

            {/* Handle 2 (p2) */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/40 hover:bg-accent/80 cursor-ew-resize flex items-center justify-center transition-all duration-300"
              style={{ left: `${p2}%` }}
              onPointerDown={handlePointerDown("p2")}
            >
              <div className={`w-7 h-7 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center shadow-md transform -translate-x-1/2 cursor-ew-resize transition-all duration-200 hover:border-accent ${dragging === "p2" ? "scale-115 border-accent bg-accent" : "scale-100"}`}>
                <span className={`text-[9px] font-bold ${dragging === "p2" ? "text-black" : "text-white/70"}`}>2</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Control panel showing labels and helper tips */}
      <div className="flex flex-wrap justify-between items-center bg-white/3 border border-white/5 rounded-lg p-3 text-xs text-white/60">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>Slide markers to peel back layers of creation</span>
        </div>
        <div className="flex gap-2 text-[10px] uppercase tracking-wider font-mono">
          {images.map((_, i) => (
            <span key={i} className={`px-1.5 py-0.5 rounded ${
              images.length === 2
                ? (i === 0 && singlePct > 50) || (i === 1 && singlePct <= 50) ? "bg-accent/15 text-accent border border-accent/20" : "bg-transparent text-white/30"
                : (i === 0 && p1 > 40) || (i === 1 && p1 <= 40 && p2 > 60) || (i === 2 && p2 <= 60) ? "bg-accent/15 text-accent border border-accent/20" : "bg-transparent text-white/30"
            }`}>
              Step {i+1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
