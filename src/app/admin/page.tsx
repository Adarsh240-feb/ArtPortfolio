"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  getDocs, 
  orderBy, 
  query, 
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { 
  Key, 
  Plus, 
  Layers, 
  Image as ImageIcon, 
  Mail, 
  LogOut, 
  Lock, 
  Sparkles, 
  Paintbrush,
  Inbox, 
  Trash2, 
  FileText,
  Check,
  MessageSquare
} from "lucide-react";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: any;
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
}

export default function AdminPage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoggedInDemo, setIsLoggedInDemo] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Tab State: "upload" | "feedback" | "inquiries"
  const [activeTab, setActiveTab] = useState<"upload" | "feedback" | "inquiries">("upload");

  // Upload Form State
  const [title, setTitle] = useState("");
  const [medium, setMedium] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState("");
  const [dominantColor, setDominantColor] = useState("#d97706");
  const [available, setAvailable] = useState(true);
  const [category, setCategory] = useState("charcoal-sketches");

  // Feedback Form State
  const [feedbackClientName, setFeedbackClientName] = useState("");
  const [feedbackClientSubtitle, setFeedbackClientSubtitle] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // File states
  const [finalImage, setFinalImage] = useState<File | null>(null);
  const [wipFiles, setWipFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // List states
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  // Check firebase config & set auth listener
  useEffect(() => {
    // Check if Firebase environment variables are missing
    const hasConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!hasConfig) {
      setIsDemoMode(true);
      setAuthLoading(false);
      
      // Load mock session from sessionStorage if exists
      const mockSession = sessionStorage.getItem("demo_admin_logged_in");
      if (mockSession === "true") {
        setIsLoggedInDemo(true);
      }
    } else {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  // Fetch inquiries when tab shifts or on login
  useEffect(() => {
    if (user || isLoggedInDemo) {
      loadInquiries();
    }
  }, [user, isLoggedInDemo, activeTab]);

  const loadInquiries = async () => {
    setInquiriesLoading(true);
    try {
      if (isDemoMode) {
        // Load mock inquiries from localStorage or default ones
        const saved = localStorage.getItem("demo_inquiries");
        if (saved) {
          setInquiries(JSON.parse(saved));
        } else {
          const defaultInquiries = [
            {
              id: "demo-inq-1",
              name: "Alice Mercer",
              email: "alice@galleryhorizon.com",
              subject: "Solo Exhibition Request - Autumn 2026",
              message: "Dear Artist, we are absolutely mesmerized by your layered 'Mist in the Pines' piece. We would love to discuss a solo exhibition block at our Tokyo gallery in September 2026. Please let us know your availability for a call.",
            },
            {
              id: "demo-inq-2",
              name: "Marcus Sterling",
              email: "marcus@sterlingart.co",
              subject: "Commission Inquiry",
              message: "I am looking to commission a large 60x60 inches piece using your Crimson/Earth tones style for my residential lounge in London. Let me know your current commission rates and lead times.",
            }
          ];
          localStorage.setItem("demo_inquiries", JSON.stringify(defaultInquiries));
          setInquiries(defaultInquiries);
        }
      } else {
        const q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Inquiry[];
        setInquiries(docs);
      }
    } catch (err) {
      console.error("Error fetching inquiries:", err);
    } finally {
      setInquiriesLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isDemoMode) {
      if (email === "admin@atelier.com" && password === "admin123") {
        setIsLoggedInDemo(true);
        sessionStorage.setItem("demo_admin_logged_in", "true");
      } else {
        setErrorMessage("Invalid credentials in Demo Mode. Use: admin@atelier.com / admin123");
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to sign in. Verify credentials.");
      }
    }
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      setIsLoggedInDemo(false);
      sessionStorage.removeItem("demo_admin_logged_in");
    } else {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout failed:", err);
      }
    }
    resetPalette();
  };

  const resetPalette = () => {
    document.documentElement.style.setProperty("--accent-color", "#d97706");
    document.documentElement.style.setProperty("--bg-gradient-start", "#0a0a0c");
    document.documentElement.style.setProperty("--bg-gradient-end", "#020203");
  };

  // Files handlers
  const handleFinalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFinalImage(e.target.files[0]);
    }
  };

  const handleWipImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setWipFiles(filesArr);
    }
  };

  const handleUploadArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !medium || !dimensions || (!finalImage && !isDemoMode)) {
      alert("Please fill in all core fields and provide a final artwork image.");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    try {
      let finalUrl = "";
      let wipUrls: string[] = [];

      if (isDemoMode) {
        // In Demo mode, we use fallback mock images to avoid storage uploads
        finalUrl = "/canvas_art.png";
        wipUrls = wipFiles.map((_, i) => i === 0 ? "/sketchbook_cover.png" : "/envelope_cover.png");
        if (wipUrls.length === 0) wipUrls = ["/sketchbook_cover.png", "/envelope_cover.png", "/canvas_art.png"];

        // Add to local storage
        const mockNewArt = {
          id: `demo-art-${Date.now()}`,
          title,
          medium,
          dimensions,
          year: Number(year),
          description,
          finalImageUrl: finalUrl,
          dominantColor,
          wipSteps: wipUrls,
          available,
          category,
        };

        // Load mock gallery items
        const savedGallery = localStorage.getItem("demo_gallery");
        const currentGallery = savedGallery ? JSON.parse(savedGallery) : [];
        localStorage.setItem("demo_gallery", JSON.stringify([mockNewArt, ...currentGallery]));

        // Prepend mock artwork to Firestore's local array (so it shows in local gallery)
        // We'll write to storage/firestore if config was present, but here we just alert success
      } else {
        // 1. Upload Final Image
        const finalRef = ref(storage, `artworks/final/${Date.now()}_${finalImage!.name}`);
        const finalSnap = await uploadBytes(finalRef, finalImage!);
        finalUrl = await getDownloadURL(finalSnap.ref);

        // 2. Upload WIP images
        for (const file of wipFiles) {
          const wipRef = ref(storage, `artworks/wip/${Date.now()}_${file.name}`);
          const wipSnap = await uploadBytes(wipRef, file);
          const url = await getDownloadURL(wipSnap.ref);
          wipUrls.push(url);
        }

        // 3. Save document to Firestore
        await addDoc(collection(db, "artworks"), {
          title,
          medium,
          dimensions,
          year: Number(year),
          description,
          finalImageUrl: finalUrl,
          dominantColor,
          wipSteps: wipUrls,
          available,
          category,
          createdAt: serverTimestamp(),
        });
      }

      // Success Reset
      setUploadSuccess(true);
      setTitle("");
      setMedium("");
      setDimensions("");
      setDescription("");
      setCategory("charcoal-sketches");
      setFinalImage(null);
      setWipFiles([]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Error uploading artwork. Check console log details.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackClientName || !feedbackMessage) {
      alert("Please enter client name and message.");
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackSuccess(false);

    try {
      if (isDemoMode) {
        const newFeedback = {
          id: `demo-feed-${Date.now()}`,
          clientName: feedbackClientName,
          clientSubtitle: feedbackClientSubtitle,
          message: feedbackMessage,
          rating: Number(feedbackRating),
          createdAt: new Date().toISOString(),
        };

        const savedFeedbacks = localStorage.getItem("demo_testimonials");
        const currentFeedbacks = savedFeedbacks ? JSON.parse(savedFeedbacks) : [];
        localStorage.setItem("demo_testimonials", JSON.stringify([newFeedback, ...currentFeedbacks]));
      } else {
        await addDoc(collection(db, "testimonials"), {
          clientName: feedbackClientName,
          clientSubtitle: feedbackClientSubtitle,
          message: feedbackMessage,
          rating: Number(feedbackRating),
          createdAt: serverTimestamp(),
        });
      }

      setFeedbackSuccess(true);
      setFeedbackClientName("");
      setFeedbackClientSubtitle("");
      setFeedbackMessage("");
      setFeedbackRating(5);
    } catch (err) {
      console.error("Feedback upload failed:", err);
      alert("Error adding feedback. Check console logs.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Display Login Gate if not authenticated
  if (!user && !isLoggedInDemo) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 relative z-25">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 rounded-xl glass-panel text-white shadow-2xl relative"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-2xl font-serif tracking-wide">Studio Gate</h1>
            <p className="text-xs text-white/50 mt-1 font-sans font-light">
              Enter credentials to unlock the administrative deck.
            </p>
          </div>

          {isDemoMode && (
            <div className="mb-6 p-3 bg-amber-950/20 border border-amber-500/20 rounded text-[11px] text-amber-300 font-sans leading-relaxed">
              <strong>Firebase config missing (Demo Mode enabled).</strong>
              <br />
              Log in with credentials: <span className="underline font-mono">admin@atelier.com</span> / <span className="underline font-mono">admin123</span> to enter the local dashboard workspace.
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 text-xs text-red-400 bg-red-950/40 border border-red-500/20 p-2.5 rounded">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans transition-colors duration-200"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                Secret Phrase
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans transition-colors duration-200"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-accent text-black font-sans font-semibold rounded hover:bg-opacity-95 transition-all duration-300 text-sm mt-4 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Unlock Admin Desk</span>
            </button>
          </form>
          
          <button 
            onClick={() => router.push("/")}
            className="w-full text-center text-xs text-white/40 hover:text-white mt-6 font-sans transition-colors cursor-pointer"
          >
            &larr; Exit to Atelier
          </button>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard Interface
  return (
    <div className="min-h-screen py-12 px-4 md:px-12 flex flex-col max-w-6xl mx-auto w-full relative z-25">
      
      {/* Top Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-12 border-b border-white/5 pb-6"
      >
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-accent flex items-center gap-1">
            <Paintbrush className="w-3.5 h-3.5 animate-pulse" />
            Atelier Curator
          </span>
          <h1 className="text-3xl font-serif text-white mt-1">Studio Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          {isDemoMode && (
            <span className="text-[9px] uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              Demo Sandbox
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-red-950/30 hover:border-red-500/20 border border-white/10 rounded text-xs text-white/70 hover:text-red-400 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Desk</span>
          </button>
        </div>
      </motion.div>

      {/* Tabs Menu */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-sans font-medium transition-all duration-300 cursor-pointer ${
            activeTab === "upload"
              ? "bg-accent border-accent text-black"
              : "bg-white/3 border-white/5 text-white/60 hover:text-white"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Upload Artwork</span>
        </button>

        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-sans font-medium transition-all duration-300 cursor-pointer relative ${
            activeTab === "feedback"
              ? "bg-accent border-accent text-black"
              : "bg-white/3 border-white/5 text-white/60 hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Customer Feedback</span>
        </button>

        <button
          onClick={() => setActiveTab("inquiries")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-sans font-medium transition-all duration-300 cursor-pointer relative ${
            activeTab === "inquiries"
              ? "bg-accent border-accent text-black"
              : "bg-white/3 border-white/5 text-white/60 hover:text-white"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Inquiries</span>
          {inquiries.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold">
              {inquiries.length}
            </span>
          )}
        </button>
      </div>

      {/* Dashboard Screens */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "upload" ? (
            /* Upload Artwork Form */
            <motion.div
              key="upload-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel p-6 md:p-8 rounded-xl shadow-xl w-full"
            >
              <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent" />
                <span>Upload New Masterpiece</span>
              </h2>

              {uploadSuccess && (
                <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/20 rounded flex items-center gap-2.5 text-xs text-emerald-400 font-sans">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Artwork record saved successfully to the database catalog!</span>
                </div>
              )}

              <form onSubmit={handleUploadArtwork} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Form Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        Artwork Title *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans"
                        placeholder="e.g., Fissure & Flow"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        Medium *
                      </label>
                      <input
                        type="text"
                        value={medium}
                        onChange={(e) => setMedium(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans"
                        placeholder="e.g., Oil & Gold Leaf on Linen"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                          Dimensions *
                        </label>
                        <input
                          type="text"
                          value={dimensions}
                          onChange={(e) => setDimensions(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans"
                          placeholder="e.g., 36 x 48 inches"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                          Year of Creation
                        </label>
                        <input
                          type="number"
                          value={year}
                          onChange={(e) => setYear(Number(e.target.value))}
                          required
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        Curation narrative / Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans resize-none leading-relaxed"
                        placeholder="Write dynamic detail notes about the creation process..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        Gallery Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 rounded focus:border-accent outline-none text-xs md:text-sm text-white font-sans cursor-pointer transition-colors"
                      >
                        <option value="acrylic-custom-portraits">Acrylic Custom Portraits</option>
                        <option value="acrylic-paintings">Acrylic Paintings</option>
                        <option value="charcoal-sketches">Charcoal Sketches</option>
                        <option value="crafts">Crafts</option>
                        <option value="celebs-illustrations">Celebs Illustrations</option>
                        <option value="achievements">Achievements</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Colors & Files */}
                  <div className="space-y-5">
                    {/* Dominant Color Picker */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        Dominant Color Hex (Accent Trigger)
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={dominantColor}
                          onChange={(e) => setDominantColor(e.target.value)}
                          className="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={dominantColor}
                          onChange={(e) => setDominantColor(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-mono"
                        />
                      </div>
                      <p className="text-[10px] text-white/40 mt-1">
                        Determines the color shift of the background gradient on artwork hover.
                      </p>
                    </div>

                    {/* Final Image File Input */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        Final Masterpiece Canvas Image *
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/15 hover:border-accent/40 rounded p-4 cursor-pointer bg-white/2 hover:bg-white/5 transition-all text-center">
                          <ImageIcon className="w-5 h-5 text-white/30 mb-1.5" />
                          <span className="text-xs text-white/60">
                            {finalImage ? finalImage.name : "Select Image file"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFinalImageChange}
                            required={!isDemoMode}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* WIP Steps Images File Input */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-sans">
                        Work-in-Progress (WIP) Stages (Select 2 files in sequence)
                      </label>
                      <label className="flex flex-col items-center justify-center border border-dashed border-white/15 hover:border-accent/40 rounded p-4 cursor-pointer bg-white/2 hover:bg-white/5 transition-all text-center">
                        <Layers className="w-5 h-5 text-white/30 mb-1.5" />
                        <span className="text-xs text-white/60">
                          {wipFiles.length > 0 
                            ? `${wipFiles.length} files selected: ${wipFiles.map(f => f.name).join(", ")}` 
                            : "Choose image steps (sketch, underpainting, etc.)"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleWipImagesChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-white/30 mt-1 leading-normal">
                        Select multiple images in chronological order. First file maps to Initial Sketch, second to Underpainting.
                      </p>
                    </div>

                    {/* Available Toggle */}
                    <div className="flex items-center justify-between p-3 bg-white/3 rounded border border-white/5">
                      <div>
                        <span className="text-xs text-white/80 font-sans font-medium block">
                          Available for Purchase
                        </span>
                        <span className="text-[10px] text-white/40">
                          Toggles the catalog tag to &quot;Available&quot; or &quot;Acquired&quot;.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={available}
                        onChange={(e) => setAvailable(e.target.checked)}
                        className="w-5 h-5 accent-accent cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-white/5">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-3 bg-accent text-black font-sans font-semibold rounded hover:bg-opacity-90 transition-all duration-300 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <span>Saving Catalog Record...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 animate-bounce" />
                        <span>Add Artwork to Catalog</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : activeTab === "feedback" ? (
            /* Feedback Form */
            <motion.div
              key="feedback-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel p-6 md:p-8 rounded-xl shadow-xl w-full"
            >
              <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-accent" />
                <span>Add Customer Feedback to Showcase</span>
              </h2>

              {feedbackSuccess && (
                <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/20 rounded flex items-center gap-2.5 text-xs text-emerald-400 font-sans">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Customer feedback published successfully!</span>
                </div>
              )}

              <form onSubmit={handleAddFeedback} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-sans">
                        Client Name *
                      </label>
                      <input
                        type="text"
                        value={feedbackClientName}
                        onChange={(e) => setFeedbackClientName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans"
                        placeholder="e.g., Adarsh Sharma"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-sans">
                        Client Subtitle *
                      </label>
                      <input
                        type="text"
                        value={feedbackClientSubtitle}
                        onChange={(e) => setFeedbackClientSubtitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans"
                        placeholder="e.g., Custom Portrait Client"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-sans">
                        Rating Stars (1-5)
                      </label>
                      <select
                        value={feedbackRating}
                        onChange={(e) => setFeedbackRating(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans cursor-pointer"
                      >
                        <option value="5">5 Stars (Excellent)</option>
                        <option value="4">4 Stars (Good)</option>
                        <option value="3">3 Stars (Average)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-sans">
                      Feedback Message *
                    </label>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      required
                      rows={6}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans resize-none leading-relaxed"
                      placeholder="e.g., Ritik created an amazing pencil sketch for my parents' anniversary. The level of detail in the faces and expressions was unbelievable! Highly recommended."
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-white/5">
                  <button
                    type="submit"
                    disabled={feedbackSubmitting}
                    className="px-6 py-3 bg-accent text-black font-sans font-semibold rounded hover:bg-opacity-90 transition-all duration-300 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feedbackSubmitting ? (
                      <span>Submitting Feedback...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Publish Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* Inquiries Tab Showcase */
            <motion.div
              key="inquiries-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel p-6 md:p-8 rounded-xl shadow-xl w-full"
            >
              <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <Inbox className="w-5 h-5 text-accent" />
                <span>Client Inquiries & Correspondence</span>
              </h2>

              {inquiriesLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-16 text-white/30 text-sm font-sans font-light">
                  <Mail className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <span>No inquiries received yet. Letters submitted in Contact will appear here.</span>
                </div>
              ) : (
                /* Inquiry list display */
                <div className="space-y-4">
                  {inquiries.map((inq) => (
                    <div 
                      key={inq.id}
                      className="p-5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 transition-colors duration-200"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3 border-b border-white/5 pb-2">
                        <div>
                          <span className="text-xs font-semibold text-white/95">{inq.name}</span>
                          <span className="text-[10px] text-accent/80 font-mono ml-2 font-light">
                            &lt;{inq.email}&gt;
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-white/30">
                          {inq.createdAt ? new Date(inq.createdAt.seconds * 1000).toLocaleString() : "Date Unavailable"}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white/80 mb-2 font-sans">
                        Subject: {inq.subject || "(No Subject)"}
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed font-sans font-light whitespace-pre-line">
                        {inq.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
