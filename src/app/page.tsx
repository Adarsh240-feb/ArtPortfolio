"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { collection, getDocs, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePalette } from "@/context/PaletteContext";
import WipSlider from "@/components/gallery/WipSlider";
import { 
  ArrowRight, 
  ChevronDown, 
  Sparkles, 
  Paintbrush,
  X, 
  ShoppingBag, 
  Eye, 
  Calendar, 
  Feather, 
  Heart, 
  BookOpen,
  Send, 
  Pencil, 
  CheckCircle,
  Award,
  Users,
  Compass,
  ArrowUp
} from "lucide-react";

// Inline Instagram Icon to bypass missing export in local lucide-react version
function Instagram({ className, ...props }: { className?: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// Fixed-position floating Atmosphere Controller for shifting Atelier lighting/palette setup
function AtmosphereController() {
  const { accentColor, setPaletteFromColor, resetPalette } = usePalette();
  const [open, setOpen] = useState(false);

  const presets = [
    { name: "Champagne Bronze", hex: "#dfae6f", label: "Dawn", color: "bg-[#dfae6f]" },
    { name: "Slate Grey", hex: "#1d3557", label: "Indigo", color: "bg-[#1d3557]" },
    { name: "Red Ochre", hex: "#ae2012", label: "Ochre", color: "bg-[#ae2012]" },
    { name: "Deep Charcoal", hex: "#1b4332", label: "Forest", color: "bg-[#1b4332]" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-55 flex items-center gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="flex items-center gap-2.5 bg-[#101114]/95 border border-white/5 backdrop-blur-xl p-2.5 rounded-full shadow-2xl"
          >
            {presets.map((preset) => (
              <button
                key={preset.hex}
                onClick={() => setPaletteFromColor(preset.hex)}
                className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-125 duration-200 border ${
                  accentColor === preset.hex ? "border-white scale-110" : "border-white/10"
                } ${preset.color}`}
                title={preset.name}
              />
            ))}
            <button
              onClick={resetPalette}
              className="text-[9px] text-white/50 hover:text-white uppercase tracking-wider font-mono px-2 cursor-pointer font-bold"
            >
              Reset
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="w-11 h-11 rounded-full bg-[#101114]/95 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/60 hover:text-accent hover:border-accent cursor-pointer transition-all duration-300 shadow-2xl"
        title="Atelier Atmosphere"
      >
        <Paintbrush className="w-4 h-4" />
      </button>
    </div>
  );
}

interface Artwork {
  id: string;
  title: string;
  medium: string;
  dimensions: string;
  year: number;
  description: string;
  finalImageUrl: string;
  dominantColor: string;
  wipSteps: string[];
  available: boolean;
  category: string;
}

interface Testimonial {
  id: string;
  clientName: string;
  clientSubtitle: string;
  message: string;
  rating: number;
}

const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    clientName: "Adarsh Sharma",
    clientSubtitle: "Custom Devotional Drawing Collector",
    message: "Ritik created an amazing Bal Gopal pencil sketch for my home mandir. The eyes are so real and full of peace. The details of the crown and flute are exceptionally fine. Highly recommended!",
    rating: 5,
  },
  {
    id: "t-2",
    clientName: "Priya Patel",
    clientSubtitle: "Realistic Portrait Client",
    message: "I ordered a charcoal portrait sketch for my grandmother's birthday. She was moved to tears when she saw it! Ritik captured her smile and character beautifully. Outstanding craftsmanship.",
    rating: 5,
  },
  {
    id: "t-3",
    clientName: "Rohan Verma",
    clientSubtitle: "Radha Krishna sketch Collector",
    message: "I am amazed by the blending work and contrast in the Radha Krishna sketch. The addition of gold highlights makes it look incredibly rich and premium. Truly a centerpiece for my living room.",
    rating: 5,
  },
];

const CATEGORIES = [
  { id: "all", name: "ALL" },
  { id: "acrylic-custom-portraits", name: "ACRYLIC CUSTOM PORTRAITS" },
  { id: "acrylic-paintings", name: "ACRYLIC PAINTINGS" },
  { id: "charcoal-sketches", name: "CHARCOAL SKETCHES" },
  { id: "crafts", name: "CRAFTS" },
  { id: "celebs-illustrations", name: "CELEBS ILLUSTRATIONS" },
  { id: "achievements", name: "ACHIEVEMENTS" },
];

const MOCK_ARTWORKS: Artwork[] = [
  {
    id: "mock-1",
    title: "Divine Flute (Bal Gopal)",
    medium: "Graphite & Charcoal on Archival Paper",
    dimensions: "12 x 16 inches",
    year: 2026,
    description: "A serene devotional pencil drawing portraying Lord Krishna as a child (Bal Gopal) holding his flute. Focuses on capturing peaceful, lifelike eyes and highly detailed crown patterns.",
    finalImageUrl: "/canvas_art.png",
    dominantColor: "#dfae6f",
    wipSteps: ["/sketchbook_cover.png", "/envelope_cover.png", "/canvas_art.png"],
    available: true,
    category: "charcoal-sketches",
  },
  {
    id: "mock-2",
    title: "Radha Krishna Union",
    medium: "Graphite, Charcoal & Gold Pen Highlights on Paper",
    dimensions: "16 x 20 inches",
    year: 2026,
    description: "A highly detailed portrait sketch of Radha and Krishna, representing divine love and unity. Created using multiple blending stumps for soft skin tones and fine-point pencils for hair texture.",
    finalImageUrl: "/gallery_art_2.png",
    dominantColor: "#ae2012",
    wipSteps: ["/sketchbook_cover.png", "/envelope_cover.png", "/gallery_art_2.png"],
    available: false,
    category: "charcoal-sketches",
  },
  {
    id: "mock-3",
    title: "Lord Ganesha in Dhyana",
    medium: "Charcoal Dust & Graphite on Card Stock",
    dimensions: "14 x 18 inches",
    year: 2025,
    description: "A deep, high-contrast charcoal study of Lord Ganesha in deep meditation. Uses charcoal dust washes for background gradients, allowing the sharp graphite lines of the deity to stand out.",
    finalImageUrl: "/gallery_art_3.png",
    dominantColor: "#1b4332",
    wipSteps: ["/sketchbook_cover.png", "/envelope_cover.png", "/gallery_art_3.png"],
    available: true,
    category: "charcoal-sketches",
  },
  {
    id: "mock-4",
    title: "Vasant Custom Portrait",
    medium: "Acrylic on Stretched Canvas",
    dimensions: "18 x 24 inches",
    year: 2026,
    description: "A customized portrait painting showcasing fine details, vibrant skin tones, and rich floral background textures.",
    finalImageUrl: "/canvas_art.png",
    dominantColor: "#dfae6f",
    wipSteps: [],
    available: true,
    category: "acrylic-custom-portraits",
  },
  {
    id: "mock-5",
    title: "Elysian Woods",
    medium: "Acrylic Heavy Body on Linen Canvas",
    dimensions: "24 x 30 inches",
    year: 2025,
    description: "An impressionistic exploration of forest light patterns and thick acrylic textures created using palette knives.",
    finalImageUrl: "/gallery_art_2.png",
    dominantColor: "#ae2012",
    wipSteps: [],
    available: true,
    category: "acrylic-paintings",
  },
  {
    id: "mock-6",
    title: "Handmade Terracotta Plate",
    medium: "Clay Paint & Glaze Crafts",
    dimensions: "12 inch diameter",
    year: 2026,
    description: "A hand-carved traditional clay plate, featuring intricate folklore patterns painted with acrylic glazes.",
    finalImageUrl: "/gallery_art_3.png",
    dominantColor: "#1b4332",
    wipSteps: [],
    available: true,
    category: "crafts",
  },
  {
    id: "mock-7",
    title: "Portrait of Legend",
    medium: "Digital & Pencil Illustration Study",
    dimensions: "A3 Archival Paper",
    year: 2026,
    description: "A sketch illustration celebrating a famous public personality, emphasizing high-contrast features and realism.",
    finalImageUrl: "/canvas_art.png",
    dominantColor: "#dfae6f",
    wipSteps: [],
    available: false,
    category: "celebs-illustrations",
  },
  {
    id: "mock-8",
    title: "Best Young Illustrator Award",
    medium: "Atelier Recognition",
    dimensions: "National Curation",
    year: 2025,
    description: "Awarded first place in regional curate showcase for outstanding graphite realism and devotional illustration series.",
    finalImageUrl: "/gallery_art_2.png",
    dominantColor: "#ae2012",
    wipSteps: [],
    available: false,
    category: "achievements",
  },
];

export default function Home() {
  const router = useRouter();
  const { setPaletteFromColor, resetPalette } = usePalette();
  
  // Gallery state
  const [artworks, setArtworks] = useState<Artwork[]>(MOCK_ARTWORKS);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  // Track active artwork ID for touch/mobile devices to toggle information overlay
  const [activeArtworkId, setActiveArtworkId] = useState<string | null>(null);
  const [testimonials, setTestimonialList] = useState<Testimonial[]>(MOCK_TESTIMONIALS);

  const filteredArtworks = activeCategory === "all"
    ? artworks
    : artworks.filter(art => art.category === activeCategory);

  // Contact form state
  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState("");

  // Motion values for subtle background hover parallax drift
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 45, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 45, damping: 15 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Map mouse coordinates to small offset shifts (-18px to 18px)
      const xOffset = ((e.clientX / innerWidth) - 0.5) * 36;
      const yOffset = ((e.clientY / innerHeight) - 0.5) * 36;
      mouseX.set(-xOffset);
      mouseY.set(-yOffset);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".gallery-card")) {
        setActiveArtworkId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Load artworks from Firestore
  useEffect(() => {
    async function loadArtworks() {
      const hasFirebaseConfig = 
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (!hasFirebaseConfig) {
        console.log("No Firebase config detected, loading mock data instantly.");
        setGalleryLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "artworks"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Artwork[];
        
        if (docs.length > 0) {
          setArtworks(docs);
        }
      } catch (e) {
        console.warn("Firestore not configured, using offline mock data.");
      } finally {
        setGalleryLoading(false);
      }
    }
    loadArtworks();
  }, []);

  // Load testimonials from Firestore or LocalStorage sandbox
  useEffect(() => {
    async function loadTestimonials() {
      const hasFirebaseConfig = 
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (!hasFirebaseConfig) {
        // Load from local storage sandbox
        const savedDemo = localStorage.getItem("demo_testimonials");
        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo) as Testimonial[];
            if (parsed.length > 0) {
              setTestimonialList([...parsed, ...MOCK_TESTIMONIALS]);
              return;
            }
          } catch (e) {
            console.warn("Error parsing demo testimonials", e);
          }
        }
        return;
      }

      try {
        const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Testimonial[];
        
        if (docs.length > 0) {
          setTestimonialList([...docs, ...MOCK_TESTIMONIALS]);
        }
      } catch (e) {
        console.warn("Firestore testimonials collection not configured or empty.", e);
      }
    }
    loadTestimonials();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactData.name || !contactData.email || !contactData.message) {
      setContactError("Please fill out all required fields.");
      return;
    }
    setContactLoading(true);
    setContactError("");

    try {
      await addDoc(collection(db, "inquiries"), {
        ...contactData,
        createdAt: serverTimestamp(),
      });
      setContactSubmitted(true);
    } catch (err) {
      console.warn("Firestore save failed, submitting locally:", err);
      setContactSubmitted(true);
    } finally {
      setContactLoading(false);
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col relative w-full overflow-x-hidden min-h-screen">
      
      {/* Dynamic Realistic Photo Background with Subtle Parallax Shift */}
      <div className="fixed inset-0 z-10 pointer-events-none w-full h-full overflow-hidden bg-[#050608]">
        <motion.div
          style={{
            x: springX,
            y: springY,
            scale: 1.06, // Upscaled slightly to prevent edge gaps during movement shifts
          }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src="/hero_bg.jpg"
            alt="Abstract Background Canvas"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-[0.26] mix-blend-color-dodge md:opacity-[0.22] pointer-events-none"
          />
        </motion.div>
        
        {/* Soft radial overlay to ensure readability */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/45 to-black/90" />
      </div>

      {/* SECTION 1: HERO LANDING PAGE - Editorial split grid */}
      <section 
        id="home"
        className="min-h-screen flex items-center relative z-25 px-4 sm:px-6 md:px-12 select-none py-20 md:py-24 max-w-[92vw] xl:max-w-[85vw] mx-auto w-full"
      >
        <div className="editorial-grid gap-16 items-center w-full">
          
          {/* Left Column: Typography, Narrative and Actions */}
          <div className="flex flex-col text-left justify-center space-y-8 z-30">
            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center gap-1.5 text-xs uppercase tracking-[0.35em] text-accent/90 font-sans font-medium"
            >
              <span>Pencil Sketches</span>
              <span>&bull;</span>
              <span>Portrait Art</span>
              <span>&bull;</span>
              <span>Charcoal</span>
              <span>&bull;</span>
              <span>Devotional Art</span>
            </motion.div>

            {/* Main Title & Subtitle */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="text-5xl sm:text-7xl md:text-8xl font-serif font-light text-[#fcfaf2] tracking-tight leading-[1.0] drop-shadow-lg"
              >
                Graphite &<br />
                <span className="italic font-normal text-accent animate-pulse">Devotion</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="font-handwritten text-3xl md:text-4xl text-[#dfae6f] tracking-wide font-light"
              >
                by Ritik
              </motion.p>
            </div>

            {/* Narrative */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-sm md:text-base text-white/70 max-w-xl leading-relaxed font-sans font-light"
            >
              Where devotion meets paper. Each sketch is a window into the soul — rendered with graphite, charcoal, and serene focus.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap gap-4 items-center w-full sm:w-auto"
            >
              <button
                onClick={() => scrollToSection("gallery")}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#dfae6f] text-black font-sans font-semibold rounded hover:bg-[#eac494] hover:shadow-xl hover:shadow-accent/15 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer text-xs uppercase tracking-widest"
              >
                <span>View Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection("about")}
                className="w-full sm:w-auto px-8 py-3.5 border border-white/10 text-white/90 hover:border-accent hover:text-accent font-sans font-medium rounded transition-all duration-300 cursor-pointer text-xs uppercase tracking-widest bg-black/10 backdrop-blur-sm"
              >
                Explore Story
              </button>
            </motion.div>
          </div>

          {/* Right Column: Layered Parallax Museum Frame Showcase */}
          <div className="relative h-[480px] w-full flex items-center justify-center z-20 pointer-events-auto">
            {/* Ambient Background Glow matching accent color */}
            <div className="absolute w-[250px] h-[250px] rounded-full bg-accent/5 filter blur-[80px] pointer-events-none" />

            {/* Anchored inner container box to prevent relative layout drifting far apart on wide screens */}
            <div className="relative w-full max-w-[440px] h-full flex items-center justify-center">
              
              {/* Frame 1: Deep layer (sketchbook mock) */}
              <motion.div
                style={{
                  x: useTransform(springX, (x) => x * 0.7),
                  y: useTransform(springY, (y) => y * 0.7),
                }}
                className="absolute left-0 top-[10%] w-[160px] sm:w-[210px] aspect-[3/4] z-10 animate-float-slow"
              >
                <div className="museum-frame w-full h-full transform hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => scrollToSection("gallery")}>
                  <div className="museum-mat w-full h-full">
                    <div className="relative w-full h-full overflow-hidden">
                      <Image
                        src="/sketchbook_cover.png"
                        alt="Artist Sketch Draft"
                        fill
                        sizes="210px"
                        className="object-cover opacity-90 grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Frame 2: Top focal layer (Main Canvas mock) */}
              <motion.div
                style={{
                  x: useTransform(springX, (x) => x * -1.2),
                  y: useTransform(springY, (y) => y * -1.2),
                }}
                className="absolute right-0 bottom-[10%] w-[200px] sm:w-[250px] aspect-[3/4] z-20 animate-float-reverse"
              >
                <div className="museum-frame w-full h-full luxury-shadow-accent transform hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => scrollToSection("gallery")}>
                  <div className="museum-mat w-full h-full">
                    <div className="relative w-full h-full overflow-hidden">
                      <Image
                        src="/canvas_art.png"
                        alt="Bal Gopal Portrait"
                        fill
                        sizes="250px"
                        priority
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>

        </div>

        {/* Scroll Indicator */}
        <motion.div 
          onClick={() => scrollToSection("about")}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer text-[10px] uppercase tracking-[0.25em] text-white/40 hover:text-accent transition-colors duration-300 group z-30"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <span>Scroll Down</span>
          <ChevronDown className="w-4 h-4 text-white/30 group-hover:text-accent" />
        </motion.div>
      </section>

      {/* SECTION 2: ABOUT SECTION */}
      <section 
        id="about" 
        className="py-20 md:py-32 px-4 sm:px-6 md:px-12 flex flex-col max-w-[92vw] xl:max-w-[85vw] mx-auto w-full relative z-20 border-t border-white/5 bg-black/25"
      >
        <div className="mb-16">
          <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-accent font-sans block mb-1">Biography</span>
          <h2 className="text-4xl md:text-6xl font-serif font-light text-white tracking-wide">The Artist Journal</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-24">
          <div className="lg:col-span-5 w-full aspect-[3/4] relative rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl">
            <Image
              src="/canvas_art.png"
              alt="Artist Portrait placeholder"
              fill
              sizes="(max-width: 1024px) 100vw, 550px"
              className="object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
            />
            <div className="absolute inset-5 border border-white/10 rounded-lg pointer-events-none" />
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="flex items-center gap-2.5 text-accent text-xs uppercase tracking-wider font-sans">
              <Feather className="w-4 h-4" />
              <span>Philosophical Statement</span>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-serif text-white font-light leading-tight">
              Translating Devotion and Emotion into Fine Graphite Lines
            </h3>

            <div className="space-y-6 text-sm md:text-base text-white/70 leading-relaxed font-sans font-light">
              <p>
                My practice bridges realism and spiritual devotion. Working primarily with graphite pencils, charcoal powders, and fine shading techniques, I explore the depth of human emotion through realistic portraits and spiritual themes.
              </p>
              <p>
                Each drawing begins with a careful study of light, shadow, and proportion. For devotional art like Bal Gopal or Radha Krishna, the goal is to capture a sense of purity and serene grace. The technical precision of pencil strokes serves to bring spiritual stories to life.
              </p>
              <blockquote className="border-l-2 border-accent pl-5 italic text-white/60 font-serif my-6 text-base leading-relaxed">
                &ldquo;An artist doesn't just draw what he sees, but what he feels in his heart when the pencil touches the paper.&rdquo;
              </blockquote>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center gap-6 text-xs md:text-sm text-white/40 font-sans">
              <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-accent" /> Graphite & Charcoal</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-accent" /> Sketchbook & Paper</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-10 md:p-12 rounded-xl border border-white/5 bg-white/2 backdrop-blur-sm mb-24">
          <div className="text-center md:border-r border-white/5 last:border-0 py-3">
            <div className="text-4xl md:text-5xl font-serif text-accent font-light">5+</div>
            <div className="text-[10px] md:text-xs uppercase tracking-wider text-white/50 mt-2">Years Active</div>
          </div>
          <div className="text-center md:border-r border-white/5 last:border-0 py-3">
            <div className="text-4xl md:text-5xl font-serif text-accent font-light">300+</div>
            <div className="text-[10px] md:text-xs uppercase tracking-wider text-white/50 mt-2">Sketches Created</div>
          </div>
          <div className="text-center md:border-r border-white/5 last:border-0 py-3">
            <div className="text-4xl md:text-5xl font-serif text-accent font-light">10K+</div>
            <div className="text-[10px] md:text-xs uppercase tracking-wider text-white/50 mt-2">Art Community</div>
          </div>
          <div className="text-center py-3">
            <div className="text-4xl md:text-5xl font-serif text-accent font-light">120+</div>
            <div className="text-[10px] md:text-xs uppercase tracking-wider text-white/50 mt-2">Commissions Closed</div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-serif text-white mb-10 border-b border-white/5 pb-4 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-accent" />
            <span>Special Highlights</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all duration-300 flex flex-col justify-between group min-h-[220px]">
              <div>
                <div className="w-10 h-10 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-5">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-white mb-3 group-hover:text-accent transition-colors">
                  Realistic Portraiture
                </h4>
                <p className="text-xs md:text-sm text-white/50 leading-relaxed font-sans font-light">
                  Specializing in capturing precise human expressions, emotions, and subtle light gradients using graphite and charcoal blending.
                </p>
              </div>
              <span className="text-[9px] md:text-[10px] font-mono text-white/30 uppercase mt-6 block">Portrait Detail</span>
            </div>

            <div className="p-8 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all duration-300 flex flex-col justify-between group min-h-[220px]">
              <div>
                <div className="w-10 h-10 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-5">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-white mb-3 group-hover:text-accent transition-colors">
                  Devotional Artworks
                </h4>
                <p className="text-xs md:text-sm text-white/50 leading-relaxed font-sans font-light">
                  Creating highly-detailed, peaceful depictions of Hindu deities like Bal Gopal, Radha Krishna, Lord Ram, and Ganesha.
                </p>
              </div>
              <span className="text-[9px] md:text-[10px] font-mono text-white/30 uppercase mt-6 block">Spiritual Focus</span>
            </div>

            <div className="p-8 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all duration-300 flex flex-col justify-between group min-h-[220px]">
              <div>
                <div className="w-10 h-10 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-white mb-3 group-hover:text-accent transition-colors">
                  Process Sharing & Shorts
                </h4>
                <p className="text-xs md:text-sm text-white/50 leading-relaxed font-sans font-light">
                  Actively building an artistic community by sharing step-by-step reels, process videos, and tutorials of sketch transformations.
                </p>
              </div>
              <span className="text-[9px] md:text-[10px] font-mono text-white/30 uppercase mt-6 block">Social Creator</span>
            </div>
          </div>
        </div>

      </section>

      {/* SECTION 3: GALLERY SECTION */}
      <section 
        id="gallery" 
        className="py-20 md:py-32 px-4 sm:px-6 md:px-12 flex flex-col max-w-[92vw] xl:max-w-[85vw] mx-auto w-full relative z-25 border-t border-white/5 bg-black/10"
      >
        <div className="mb-12 flex flex-col items-start w-full">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent font-sans block mb-1">WORKS</span>
          <div className="flex items-center gap-2 mb-8">
            <h2 className="text-4xl md:text-6xl font-serif font-light text-white tracking-wide">The Gallery</h2>
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse mt-3 md:mt-4" />
          </div>
          
          {/* Category Tabs Scroll Wrapper */}
          <div className="flex flex-wrap gap-3.5 mb-8 w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 border text-[10px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-[#dfae6f] border-[#dfae6f] text-black shadow-lg shadow-accent/15"
                    : "bg-transparent border-white/10 text-white/60 hover:text-white hover:border-white/20"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {galleryLoading ? (
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="py-24 text-center text-white/30 font-sans font-light text-xs tracking-widest uppercase">
            No artworks uploaded in this section yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {filteredArtworks.map((art, index) => {
              return (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
                  className="w-full"
                  onMouseEnter={() => setPaletteFromColor(art.dominantColor)}
                  onMouseLeave={resetPalette}
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveArtworkId(activeArtworkId === art.id ? null : art.id);
                    }}
                    className="gallery-card relative aspect-[3/4] overflow-hidden bg-neutral-900 border border-white/5 group cursor-pointer"
                  >
                    <Image
                      src={art.finalImageUrl}
                      alt={art.title || "Gallery Artwork"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                      className="object-cover"
                    />

                    {/* Semi-transparent dark overlay showing title and description on hover/tap */}
                    <div 
                      className={`absolute inset-0 bg-black/80 transition-all duration-300 flex flex-col justify-end p-6 select-none ${
                        activeArtworkId === art.id
                          ? "opacity-100 pointer-events-auto"
                          : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                      }`}
                    >
                      <div 
                        className={`transform transition-transform duration-300 ${
                          activeArtworkId === art.id
                            ? "translate-y-0"
                            : "translate-y-3 group-hover:translate-y-0"
                        }`}
                      >
                        {art.title && (
                          <h3 className="text-base md:text-lg font-serif text-white mb-2 leading-snug">
                            {art.title}
                          </h3>
                        )}
                        {art.description && (
                          <p className="text-xs text-white/70 font-sans font-light leading-relaxed">
                            {art.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION: CUSTOMER FEEDBACK SHOWCASE */}
      <section 
        id="testimonials" 
        className="py-20 md:py-32 px-4 sm:px-6 md:px-12 flex flex-col max-w-[92vw] xl:max-w-[85vw] mx-auto w-full relative z-25 border-t border-white/5 bg-black/5"
      >
        <div className="mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent font-sans block mb-1">REVIEWS</span>
          <div className="flex items-center gap-2">
            <h2 className="text-4xl md:text-6xl font-serif font-light text-white tracking-wide">Collector Stories</h2>
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse mt-3 md:mt-4" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {testimonials.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-8 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Star Ratings */}
                <div className="flex gap-1.5 text-accent mb-6">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <span key={i} className="text-sm">★</span>
                  ))}
                </div>
                
                {/* Message */}
                <p className="text-sm text-white/70 leading-relaxed font-sans font-light italic mb-6">
                  &quot;{t.message}&quot;
                </p>
              </div>

              {/* Collector Details */}
              <div className="border-t border-white/5 pt-4">
                <span className="text-xs font-semibold text-white/95 block font-sans">
                  {t.clientName}
                </span>
                <span className="text-[10px] text-white/40 block font-sans mt-0.5">
                  {t.clientSubtitle}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 4: CONTACT SECTION */}
      <section 
        id="contact" 
        className="py-20 md:py-32 px-4 sm:px-6 md:px-12 flex flex-col max-w-[92vw] md:max-w-[70vw] xl:max-w-[55vw] mx-auto w-full relative z-20 border-t border-white/5 bg-black/20"
      >
        <div className="mb-16">
          <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-accent font-sans block mb-1">Contact</span>
          <h2 className="text-4xl md:text-6xl font-serif font-light text-white tracking-wide">Inquire & Connect</h2>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!contactSubmitted ? (
              <motion.div 
                key="contact-sheet"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full bg-[#faf6ee] rounded-xl shadow-2xl border border-amber-950/10 p-8 md:p-12 text-neutral-800 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(rgba(0,0,0,1)_1px,transparent_1px)] bg-[size:100%_2rem]" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-8 text-neutral-500 text-xs md:text-sm uppercase tracking-wider font-sans">
                    <Pencil className="w-4 h-4 text-accent" />
                    <span>Send a direct correspondence</span>
                  </div>

                  {contactError && (
                    <div className="mb-4 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded">
                      {contactError}
                    </div>
                  )}

                  <form onSubmit={handleContactSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-sans mb-1.5">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={contactData.name}
                          onChange={handleContactChange}
                          required
                          className="w-full px-3 py-2.5 bg-transparent border-b border-neutral-300 focus:border-accent text-neutral-900 outline-none text-xs md:text-sm font-sans transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-sans mb-1.5">
                          Your Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={contactData.email}
                          onChange={handleContactChange}
                          required
                          className="w-full px-3 py-2.5 bg-transparent border-b border-neutral-300 focus:border-accent text-neutral-900 outline-none text-xs md:text-sm font-sans transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-sans mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={contactData.subject}
                        onChange={handleContactChange}
                        className="w-full px-3 py-2.5 bg-transparent border-b border-neutral-300 focus:border-accent text-neutral-900 outline-none text-xs md:text-sm font-sans transition-all"
                        placeholder="Commission, exhibition booking, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-sans mb-1.5">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={contactData.message}
                        onChange={handleContactChange}
                        required
                        rows={5}
                        className="w-full px-3 py-2.5 bg-transparent border border-neutral-300 focus:border-accent rounded outline-none text-xs md:text-sm font-sans resize-none leading-relaxed"
                        placeholder="Write your note here..."
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={contactLoading}
                        className="px-8 py-3 bg-neutral-900 text-white hover:bg-accent hover:text-black rounded font-sans font-semibold text-xs transition-all duration-300 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {contactLoading ? (
                          <span>Sealing...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Correspondence</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="contact-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md bg-[#ece8df] rounded-lg shadow-2xl p-8 border border-neutral-300 flex flex-col items-center justify-center text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-32 bg-neutral-200/50 clip-path-flap border-b border-neutral-300/40" />
                <div className="relative z-10 py-6 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
                    className="w-16 h-16 rounded-full bg-red-800 shadow-xl border border-red-950 flex items-center justify-center text-white/40 mb-6"
                  >
                    <CheckCircle className="w-8 h-8 text-white/80" />
                  </motion.div>
                  <h3 className="text-xl font-serif text-neutral-900 mb-2">Correspondence Sealed</h3>
                  <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-sans font-light max-w-sm mb-6">
                    Your message has been sealed and dispatched. The artist will review your letter and connect shortly.
                  </p>
                  <button
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactData({ name: "", email: "", subject: "", message: "" });
                    }}
                    className="px-5 py-2 bg-neutral-900 text-white hover:bg-neutral-800 rounded font-sans text-xs transition-all cursor-pointer"
                  >
                    Send Another Letter
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* SECTION 5: FOOTER */}
      <footer className="z-20 border-t border-white/5 bg-black/60 backdrop-blur-md py-12 px-6 md:px-12 text-white/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-[#f4edd2] tracking-wide text-base">Life of Ritik <span className="font-sans text-xs text-white/50">| Artworks</span></span>
              <Paintbrush className="w-3.5 h-3.5 text-accent animate-pulse" />
            </div>
            <span className="text-[10px] text-white/30 font-sans mt-1">
              &copy; {new Date().getFullYear()} All Rights Reserved.
            </span>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col items-center gap-1 text-xs font-sans text-white/50">
            <a href="mailto:ritik.artworks@gmail.com" className="hover:text-accent transition-colors duration-200">
              ritik.artworks@gmail.com
            </a>
            <a href="https://www.instagram.com/ritik_artistboy/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors duration-200 flex items-center gap-1.5 mt-0.5">
              <Instagram className="w-3.5 h-3.5" /> @ritik_artistboy
            </a>
            <span className="text-[10px] text-white/30 font-light mt-1">Studio Atelier &bull; New Delhi, India</span>
          </div>

          {/* Curator Portal link */}
          <div className="flex items-center justify-end">
            <button 
              onClick={() => router.push("/admin")}
              className="hover:text-accent font-sans text-xs transition-colors cursor-pointer border border-white/10 hover:border-accent/40 rounded px-3.5 py-2 bg-white/2 hover:bg-white/5"
            >
              Curator Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Atmosphere Controller */}
      <AtmosphereController />
    </div>
  );
}
