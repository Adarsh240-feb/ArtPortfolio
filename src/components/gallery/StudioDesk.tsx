"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePalette } from "@/context/PaletteContext";
import { Sparkles, Key, Mail, BookOpen, Layers } from "lucide-react";

// Reusable 3D Tilt Card wrapper
function TiltCard({
  children,
  onClick,
  className = "",
  rotation = 0,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  rotation?: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map mouse movement to 3D rotation
  const rotateX = useSpring(useTransform(y, [-150, 150], [15, -15]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-150, 150], [-15, 15]), {
    stiffness: 150,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ rotate: rotation, scale: 0.95, opacity: 0 }}
      animate={{ rotate: rotation, scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, rotate: 0, zIndex: 40 }}
      transition={{
        scale: { type: "spring", stiffness: 200, damping: 15 },
        rotate: { duration: 0.4 },
        opacity: { duration: 0.5 },
      }}
      className={`desk-item ${className}`}
    >
      <div style={{ transform: "translateZ(30px)" }} className="w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}

export default function StudioDesk() {
  const router = useRouter();
  const { setPaletteFromColor, resetPalette } = usePalette();
  const deskRef = useRef<HTMLDivElement | null>(null);

  // Colors on the palette
  const paletteColors = [
    { name: "Gold Dust", hex: "#e0a96d", bg: "bg-[#e0a96d]" },
    { name: "Slate Grey", hex: "#1d3557", bg: "bg-[#1d3557]" },
    { name: "Red Ochre", hex: "#ae2012", bg: "bg-[#ae2012]" },
    { name: "Deep Charcoal", hex: "#1b4332", bg: "bg-[#1b4332]" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 min-h-screen relative overflow-hidden select-none">
      
      {/* Dynamic Header */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-8 md:mb-12 relative z-30 pointer-events-auto"
      >
        <span className="text-xs uppercase tracking-[0.25em] text-accent font-sans font-medium transition-colors duration-300">
          Atelier / Creative Space
        </span>
        <h1 className="text-4xl md:text-6xl font-serif mt-2 tracking-wide font-light">
          Graphite & Devotion
        </h1>
        <p className="text-xs md:text-sm font-light text-foreground/60 mt-3 font-sans italic max-w-md mx-auto">
          Hover or tap on the desk objects to explore. Interact with the graphite & color palette blobs to shift the studio&apos;s mood.
        </p>
      </motion.div>

      {/* Desk Wrapper with scale responsive transform */}
      <div className="w-full max-w-[1100px] h-[550px] md:h-[650px] relative z-20 pointer-events-auto flex items-center justify-center">
        
        {/* The Desk Surface container */}
        <div 
          ref={deskRef} 
          className="w-full h-full relative scale-[0.68] sm:scale-[0.85] md:scale-100 transition-transform duration-500 origin-center"
        >
          
          {/* 1. Canvas Frame (Gallery Route) */}
          <TiltCard
            rotation={-3}
            onClick={() => {
              const el = document.getElementById("gallery");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="absolute left-[8%] top-[10%] w-[320px] h-[400px] cursor-pointer"
          >
            <div className="w-full h-full p-4 bg-[#141519] border-[12px] border-amber-950/20 shadow-2xl rounded-sm flex flex-col justify-between group">
              <div className="relative w-full h-[82%] overflow-hidden bg-black/40 rounded-sm">
                <Image
                  src="/canvas_art.png"
                  alt="Fine Art Canvas"
                  fill
                  sizes="300px"
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="flex items-center gap-2 text-white text-xs">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-accent" />
                    <span>View Art Collection</span>
                  </div>
                </div>
              </div>
              <div className="text-center pt-2 border-t border-white/5 flex items-center justify-between px-1">
                <span className="font-serif text-sm tracking-wide text-white/90">Gallery Collection</span>
                <span className="text-[11px] font-handwritten text-accent flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Enter
                </span>
              </div>
            </div>
          </TiltCard>

          {/* 2. Sketchbook (About Route) */}
          <TiltCard
            rotation={6}
            onClick={() => {
              const el = document.getElementById("about");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="absolute right-[10%] bottom-[8%] w-[260px] h-[340px] cursor-pointer"
          >
            <div className="w-full h-full bg-[#2a2723] rounded-lg shadow-2xl border-l-[14px] border-amber-900/40 p-5 flex flex-col justify-between group relative overflow-hidden">
              {/* Paper bookmark */}
              <div className="absolute top-0 right-6 w-3 h-16 bg-accent/80 transform origin-top transition-transform duration-300 group-hover:translate-y-2 rounded-b" />
              
              <div className="relative w-full h-full flex flex-col justify-between z-10">
                <div className="w-full h-[65%] relative rounded-md overflow-hidden bg-amber-950/30">
                  <Image
                    src="/sketchbook_cover.png"
                    alt="Leather Sketchbook"
                    fill
                    sizes="250px"
                    className="object-cover mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500"
                  />
                </div>
                <div className="pt-3 border-t border-white/5">
                  <span className="text-[11px] uppercase tracking-wider text-white/50 block font-sans">
                    Artist Journal
                  </span>
                  <span className="font-serif text-base text-white/90 block group-hover:text-accent transition-colors duration-300">
                    The Process & Bio
                  </span>
                  <span className="text-xs text-white/40 mt-1 font-handwritten flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Read entry
                  </span>
                </div>
              </div>
            </div>
          </TiltCard>

          {/* 3. Envelope / Letter (Contact Route) */}
          <TiltCard
            rotation={-12}
            onClick={() => {
              const el = document.getElementById("contact");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="absolute left-[12%] bottom-[6%] w-[240px] h-[170px] cursor-pointer"
          >
            <div className="w-full h-full p-4 bg-[#ece8df] rounded shadow-xl border border-amber-900/10 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-transparent" />
              <div className="relative w-full h-full flex flex-col justify-between z-10 text-neutral-800">
                <div className="flex items-start justify-between">
                  <Mail className="w-5 h-5 text-neutral-600 group-hover:text-accent transition-colors duration-300" />
                  <div className="w-8 h-8 rounded-full border border-neutral-300 bg-neutral-200/50 flex items-center justify-center text-[10px] font-serif font-bold text-neutral-500">
                    PAID
                  </div>
                </div>
                <div>
                  <div className="font-handwritten text-xs text-neutral-500">To: The Artist</div>
                  <div className="font-serif text-sm font-semibold tracking-wide text-neutral-900 mt-0.5">
                    Send Inquiry
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                    <span>Write message</span> &rarr;
                  </div>
                </div>
              </div>
              
              {/* Envelope seal mockup */}
              <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-red-800/90 shadow-inner flex items-center justify-center text-white/20 select-none group-hover:scale-105 transition-transform duration-300 border border-red-950">
                <span className="text-[8px] font-serif font-extrabold tracking-tighter">AI</span>
              </div>
            </div>
          </TiltCard>

          {/* 4. Paint Palette (Color Controller) */}
          <TiltCard
            rotation={8}
            className="absolute right-[14%] top-[12%] w-[260px] h-[200px]"
          >
            <div className="w-full h-full p-3 bg-amber-950/10 rounded-xl relative shadow-lg group">
              <div className="w-full h-full relative rounded-lg overflow-hidden bg-neutral-950/20">
                <Image
                  src="/paint_palette.png"
                  alt="Artist Paint Palette"
                  fill
                  sizes="250px"
                  className="object-cover"
                />
                
                {/* Overlay color blobs */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/10 group-hover:bg-black/5 transition-colors duration-300">
                  <div className="absolute bottom-2 left-3 text-[10px] font-handwritten text-white/70 tracking-wider">
                    Shades & Tones
                  </div>
                  
                  {/* Interactive paint blobs */}
                  <div className="flex gap-2.5 items-center justify-center">
                    {paletteColors.map((color, idx) => (
                      <button
                        key={idx}
                        onMouseEnter={() => setPaletteFromColor(color.hex)}
                        onClick={() => setPaletteFromColor(color.hex)}
                        title={color.name}
                        className={`w-6 h-6 rounded-full ${color.bg} border-2 border-white/20 shadow-md transform hover:scale-125 hover:border-white transition-all duration-200 cursor-pointer`}
                      />
                    ))}
                    
                    {/* Reset Button */}
                    <button
                      onClick={resetPalette}
                      title="Reset Theme"
                      className="w-5 h-5 rounded-full bg-black/40 border border-white/10 text-white/70 flex items-center justify-center hover:scale-110 hover:bg-black/60 hover:text-white transition-all duration-200 cursor-pointer text-[9px] font-sans"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>

          {/* 5. The Hidden Admin Key */}
          <motion.div
            initial={{ opacity: 0.3 }}
            whileHover={{ opacity: 1, scale: 1.1 }}
            onClick={() => router.push("/admin")}
            title="Admin Login Gate"
            className="absolute left-[45%] bottom-[22%] cursor-pointer group p-2 rounded-full border border-white/5 hover:border-accent/20 bg-white/2 hover:bg-white/5 shadow-md transition-all duration-300"
          >
            <Key className="w-4 h-4 text-white/20 group-hover:text-accent transition-colors duration-300" />
          </motion.div>

        </div>
      </div>
    </div>
  );
}
