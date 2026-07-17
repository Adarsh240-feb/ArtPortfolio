"use client";

import React, { useEffect, useRef } from "react";
import { usePalette } from "@/context/PaletteContext";

interface StrokePoint {
  x: number;
  y: number;
  size: number;
  life: number;
  decay: number;
  color: string;
  vx: number;
  vy: number;
}

export default function BrushstrokeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<StrokePoint[]>([]);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const { accentColor } = usePalette();
  const accentColorRef = useRef(accentColor);

  // Keep ref updated to avoid stale closures in useEffect listener
  useEffect(() => {
    accentColorRef.current = accentColor;
  }, [accentColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle resizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation loop control
    let animationId: number | null = null;
    let isLooping = false;

    const render = () => {
      const points = pointsRef.current;

      if (points.length === 0) {
        // Clear canvas one last time and stop the loop
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isLooping = false;
        animationId = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];

        // Draw watercolor bleed effect
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * (1 + (1 - p.life) * 0.5) // Grow slightly as it bleeds
        );

        // Parse hex to rgb to apply opacity
        let r = 217, g = 119, b = 6;
        const colorToUse = p.color;
        if (colorToUse.startsWith("#")) {
          const hex = colorToUse.replace("#", "");
          const num = parseInt(hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex, 16);
          r = (num >> 16) & 255;
          g = (num >> 8) & 255;
          b = num & 255;
        }

        const alpha = p.life * 0.12; // Cap max opacity at 12% for subtleness

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - p.life) * 0.5), 0, Math.PI * 2);
        ctx.fill();

        // Update particle physics
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        // Remove dead points
        if (p.life <= 0) {
          points.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    const startLoopIfNeeded = () => {
      if (!isLooping) {
        isLooping = true;
        animationId = requestAnimationFrame(render);
      }
    };

    // Handle mouse/pointer movement
    const handlePointerMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      // Calculate distance from last point
      const dx = x - lastPosRef.current.x;
      const dy = y - lastPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only add points if moved enough to prevent clustering
      if (distance > 8) {
        const color = accentColorRef.current || "#d97706";
        
        // Add particle
        pointsRef.current.push({
          x,
          y,
          size: Math.random() * 20 + 20, // 20px to 40px
          life: 1.0,
          decay: Math.random() * 0.015 + 0.01, // Takes 60-100 frames to fade
          color,
          // Minor random drift
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4 - 0.2, // Drift slightly upwards
        });

        // Limit maximum active points
        if (pointsRef.current.length > 80) {
          pointsRef.current.shift();
        }

        lastPosRef.current = { x, y };
        
        // Start animation loop when points are added
        startLoopIfNeeded();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);

    // Clean up
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="interactive-canvas" />;
}
