"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  User
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  getDocs, 
  orderBy, 
  query, 
  serverTimestamp,
  doc,
  deleteDoc,
  getDoc,
  setDoc
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
  MessageSquare,
  Pencil
} from "lucide-react";

const compressImage = (file: File, maxWidth = 1200, quality = 0.85): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

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
  category: string;
}

interface Testimonial {
  id: string;
  screenshotUrl: string;
  createdAt?: any;
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

  // Tab State: "upload" | "feedback" | "inquiries" | "about"
  const [activeTab, setActiveTab] = useState<"upload" | "feedback" | "inquiries" | "about">("upload");

  // Upload Form State
  const [title, setTitle] = useState("");
  const [medium, setMedium] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState("");
  const [dominantColor, setDominantColor] = useState("#dfae6f");
  const [available, setAvailable] = useState(true);
  const [category, setCategory] = useState("charcoal-sketches");
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);
  const [editingFinalImageUrl, setEditingFinalImageUrl] = useState("");

  // Feedback Form State (Screenshot only)
  const [feedbackScreenshotFile, setFeedbackScreenshotFile] = useState<File | null>(null);
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
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [artworksLoading, setArtworksLoading] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);

  // About Settings state
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutParagraph1, setAboutParagraph1] = useState("");
  const [aboutParagraph2, setAboutParagraph2] = useState("");
  const [aboutQuote, setAboutQuote] = useState("");
  const [aboutImageUrl, setAboutImageUrl] = useState("");
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [heroLeftImageUrl, setHeroLeftImageUrl] = useState("");
  const [heroLeftImageFile, setHeroLeftImageFile] = useState<File | null>(null);
  const [heroRightImageUrl, setHeroRightImageUrl] = useState("");
  const [heroRightImageFile, setHeroRightImageFile] = useState<File | null>(null);
  const [savingAbout, setSavingAbout] = useState(false);
  const [saveAboutSuccess, setSaveAboutSuccess] = useState(false);

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

  // Fetch all dashboard datasets on login to populate notification badges and cache tables
  useEffect(() => {
    if (user || isLoggedInDemo) {
      loadInquiries();
      loadTestimonials();
      loadArtworks();
      loadAboutSettings();
    }
  }, [user, isLoggedInDemo]);

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

  const loadArtworks = async () => {
    setArtworksLoading(true);
    try {
      if (isDemoMode) {
        const saved = localStorage.getItem("demo_gallery");
        const demoArtworks = saved ? JSON.parse(saved) : [];
        setArtworks(demoArtworks);
      } else {
        const q = query(collection(db, "artworks"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Artwork[];
        setArtworks(docs);
      }
    } catch (err) {
      console.error("Error fetching artworks:", err);
    } finally {
      setArtworksLoading(false);
    }
  };

  const loadTestimonials = async () => {
    setTestimonialsLoading(true);
    try {
      if (isDemoMode) {
        const saved = localStorage.getItem("demo_testimonials");
        const demoTestimonials = saved ? JSON.parse(saved) : [];
        setTestimonials(demoTestimonials);
      } else {
        const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Testimonial[];
        setTestimonials(docs);
      }
    } catch (err) {
      console.error("Error fetching testimonials:", err);
    } finally {
      setTestimonialsLoading(false);
    }
  };

  const loadAboutSettings = async () => {
    try {
      if (isDemoMode) {
        const saved = localStorage.getItem("demo_about");
        if (saved) {
          const data = JSON.parse(saved);
          setAboutTitle(data.title || "");
          setAboutParagraph1(data.paragraph1 || "");
          setAboutParagraph2(data.paragraph2 || "");
          setAboutQuote(data.quote || "");
          setAboutImageUrl(data.imageUrl || "");
          setHeroLeftImageUrl(data.heroLeftImageUrl || "");
          setHeroRightImageUrl(data.heroRightImageUrl || "");
        }
      } else {
        const docSnap = await getDoc(doc(db, "settings", "about"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAboutTitle(data.title || "");
          setAboutParagraph1(data.paragraph1 || "");
          setAboutParagraph2(data.paragraph2 || "");
          setAboutQuote(data.quote || "");
          setAboutImageUrl(data.imageUrl || "");
          setHeroLeftImageUrl(data.heroLeftImageUrl || "");
          setHeroRightImageUrl(data.heroRightImageUrl || "");
        }
      }
    } catch (err) {
      console.error("Error fetching About settings:", err);
    }
  };

  const handleDeleteArtwork = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artwork?")) return;
    try {
      if (isDemoMode) {
        const saved = localStorage.getItem("demo_gallery");
        if (saved) {
          const current = JSON.parse(saved) as Artwork[];
          const updated = current.filter(art => art.id !== id);
          localStorage.setItem("demo_gallery", JSON.stringify(updated));
          setArtworks(updated);
        }
      } else {
        await deleteDoc(doc(db, "artworks", id));
        setArtworks(prev => prev.filter(art => art.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete artwork:", err);
      alert("Error deleting artwork.");
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client feedback?")) return;
    try {
      if (isDemoMode) {
        const saved = localStorage.getItem("demo_testimonials");
        if (saved) {
          const current = JSON.parse(saved) as Testimonial[];
          const updated = current.filter(t => t.id !== id);
          localStorage.setItem("demo_testimonials", JSON.stringify(updated));
          setTestimonials(updated);
        }
      } else {
        await deleteDoc(doc(db, "testimonials", id));
        setTestimonials(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete testimonial:", err);
      alert("Error deleting feedback.");
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      if (isDemoMode) {
        const saved = localStorage.getItem("demo_inquiries");
        if (saved) {
          const current = JSON.parse(saved) as Inquiry[];
          const updated = current.filter(inq => inq.id !== id);
          localStorage.setItem("demo_inquiries", JSON.stringify(updated));
          setInquiries(updated);
        }
      } else {
        await deleteDoc(doc(db, "inquiries", id));
        setInquiries(prev => prev.filter(inq => inq.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete inquiry:", err);
      alert("Error deleting inquiry.");
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
        await setPersistence(auth, browserSessionPersistence);
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        setErrorMessage("Not an authorized user.");
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

  const handleEditArtwork = (art: Artwork) => {
    setEditingArtworkId(art.id);
    setTitle(art.title || "");
    setMedium(art.medium || "");
    setDimensions(art.dimensions || "");
    setYear(art.year || new Date().getFullYear());
    setDescription(art.description || "");
    setDominantColor(art.dominantColor || "#d97706");
    setAvailable(art.available !== false);
    setCategory(art.category || "charcoal-sketches");
    setEditingFinalImageUrl(art.finalImageUrl || "");
    setUploadSuccess(false);

    // Scroll smoothly to the form container
    const formEl = document.getElementById("artwork-form-top");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditingArtworkId(null);
    setTitle("");
    setMedium("");
    setDimensions("");
    setYear(new Date().getFullYear());
    setDescription("");
    setDominantColor("#dfae6f");
    setAvailable(true);
    setCategory("charcoal-sketches");
    setEditingFinalImageUrl("");
    setFinalImage(null);
    setWipFiles([]);
  };

  const handleUploadArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !medium || !dimensions || (!finalImage && !editingArtworkId && !isDemoMode)) {
      alert("Please fill in all core fields and provide a final artwork image.");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    try {
      let finalUrl = editingArtworkId ? editingFinalImageUrl : "";
      const currentDominantColor = "#dfae6f";
      const currentWipUrls: string[] = [];

      if (isDemoMode) {
        if (editingArtworkId) {
          // Edit existing in Demo Mode
          if (finalImage) {
            finalUrl = URL.createObjectURL(finalImage);
          }

          const savedGallery = localStorage.getItem("demo_gallery");
          const currentGallery: Artwork[] = savedGallery ? JSON.parse(savedGallery) : [];
          const updatedGallery = currentGallery.map((art) => {
            if (art.id === editingArtworkId) {
              return {
                ...art,
                title,
                medium,
                dimensions,
                year: Number(year),
                description,
                finalImageUrl: finalUrl,
                dominantColor: currentDominantColor,
                wipSteps: currentWipUrls,
                available,
                category,
              };
            }
            return art;
          });
          localStorage.setItem("demo_gallery", JSON.stringify(updatedGallery));
        } else {
          // Upload new in Demo Mode
          finalUrl = "/canvas_art.png";

          const mockNewArt = {
            id: `demo-art-${Date.now()}`,
            title,
            medium,
            dimensions,
            year: Number(year),
            description,
            finalImageUrl: finalUrl,
            dominantColor: currentDominantColor,
            wipSteps: currentWipUrls,
            available,
            category,
          };

          const savedGallery = localStorage.getItem("demo_gallery");
          const currentGallery = savedGallery ? JSON.parse(savedGallery) : [];
          localStorage.setItem("demo_gallery", JSON.stringify([mockNewArt, ...currentGallery]));
        }
      } else {
        // Live Firebase Mode
        // 1. Upload Final Image if a new file is chosen
        if (finalImage) {
          const compressedFile = await compressImage(finalImage, 1400, 0.82);
          const finalRef = ref(storage, `artworks/final/${Date.now()}_${finalImage.name}`);
          const finalSnap = await uploadBytes(finalRef, compressedFile);
          finalUrl = await getDownloadURL(finalSnap.ref);
        }

        if (editingArtworkId) {
          // Update in Firestore
          await setDoc(doc(db, "artworks", editingArtworkId), {
            title,
            medium,
            dimensions,
            year: Number(year),
            description,
            finalImageUrl: finalUrl,
            dominantColor: currentDominantColor,
            wipSteps: currentWipUrls,
            available,
            category,
          }, { merge: true });
        } else {
          // Add new to Firestore
          await addDoc(collection(db, "artworks"), {
            title,
            medium,
            dimensions,
            year: Number(year),
            description,
            finalImageUrl: finalUrl,
            dominantColor: currentDominantColor,
            wipSteps: currentWipUrls,
            available,
            category,
            createdAt: serverTimestamp(),
          });
        }
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
      setEditingArtworkId(null);
      setEditingFinalImageUrl("");
      loadArtworks();
    } catch (err) {
      console.error("Upload/Update failed:", err);
      alert("Error saving artwork. Check console log details.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackScreenshotFile) {
      alert("Please select a screenshot file first.");
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackSuccess(false);

    try {
      if (isDemoMode) {
        const screenshotUrl = URL.createObjectURL(feedbackScreenshotFile);
        const newFeedback = {
          id: `demo-feed-${Date.now()}`,
          screenshotUrl: screenshotUrl,
          createdAt: new Date().toISOString(),
        };

        const savedFeedbacks = localStorage.getItem("demo_testimonials");
        const currentFeedbacks = savedFeedbacks ? JSON.parse(savedFeedbacks) : [];
        localStorage.setItem("demo_testimonials", JSON.stringify([newFeedback, ...currentFeedbacks]));
      } else {
        const compressedFeedback = await compressImage(feedbackScreenshotFile, 1000, 0.85);
        const fileRef = ref(storage, `testimonials/review_${Date.now()}_${feedbackScreenshotFile.name}`);
        const snap = await uploadBytes(fileRef, compressedFeedback);
        const screenshotUrl = await getDownloadURL(snap.ref);

        await addDoc(collection(db, "testimonials"), {
          screenshotUrl,
          createdAt: serverTimestamp(),
        });
      }

      setFeedbackSuccess(true);
      setFeedbackScreenshotFile(null);
      
      // Reset the file input field in the DOM
      const fileInput = document.getElementById("feedback-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      loadTestimonials();
    } catch (err) {
      console.error("Feedback upload failed:", err);
      alert("Error adding feedback screenshot. Check console logs.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleSaveAboutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAbout(true);
    setSaveAboutSuccess(false);

    try {
      let finalImageUrl = aboutImageUrl;
      let finalLeftImageUrl = heroLeftImageUrl;
      let finalRightImageUrl = heroRightImageUrl;

      if (isDemoMode) {
        if (aboutImageFile) {
          finalImageUrl = URL.createObjectURL(aboutImageFile);
        }
        if (heroLeftImageFile) {
          finalLeftImageUrl = URL.createObjectURL(heroLeftImageFile);
        }
        if (heroRightImageFile) {
          finalRightImageUrl = URL.createObjectURL(heroRightImageFile);
        }
        
        const newAbout = {
          title: aboutTitle,
          paragraph1: aboutParagraph1,
          paragraph2: aboutParagraph2,
          quote: aboutQuote,
          imageUrl: finalImageUrl,
          heroLeftImageUrl: finalLeftImageUrl,
          heroRightImageUrl: finalRightImageUrl,
        };

        localStorage.setItem("demo_about", JSON.stringify(newAbout));
        setAboutImageUrl(finalImageUrl);
        setHeroLeftImageUrl(finalLeftImageUrl);
        setHeroRightImageUrl(finalRightImageUrl);
      } else {
        if (aboutImageFile) {
          const compressed = await compressImage(aboutImageFile, 800, 0.85);
          const fileRef = ref(storage, `settings/about_${Date.now()}_${aboutImageFile.name}`);
          const snap = await uploadBytes(fileRef, compressed);
          finalImageUrl = await getDownloadURL(snap.ref);
          setAboutImageUrl(finalImageUrl);
        }
        if (heroLeftImageFile) {
          const compressed = await compressImage(heroLeftImageFile, 1000, 0.85);
          const fileRef = ref(storage, `settings/hero_left_${Date.now()}_${heroLeftImageFile.name}`);
          const snap = await uploadBytes(fileRef, compressed);
          finalLeftImageUrl = await getDownloadURL(snap.ref);
          setHeroLeftImageUrl(finalLeftImageUrl);
        }
        if (heroRightImageFile) {
          const compressed = await compressImage(heroRightImageFile, 1000, 0.85);
          const fileRef = ref(storage, `settings/hero_right_${Date.now()}_${heroRightImageFile.name}`);
          const snap = await uploadBytes(fileRef, compressed);
          finalRightImageUrl = await getDownloadURL(snap.ref);
          setHeroRightImageUrl(finalRightImageUrl);
        }

        await setDoc(doc(db, "settings", "about"), {
          title: aboutTitle,
          paragraph1: aboutParagraph1,
          paragraph2: aboutParagraph2,
          quote: aboutQuote,
          imageUrl: finalImageUrl,
          heroLeftImageUrl: finalLeftImageUrl,
          heroRightImageUrl: finalRightImageUrl,
        });
      }

      setSaveAboutSuccess(true);
      setAboutImageFile(null);
      setHeroLeftImageFile(null);
      setHeroRightImageFile(null);
    } catch (err) {
      console.error("Save About settings failed:", err);
      alert("Error saving About settings. Check console log.");
    } finally {
      setSavingAbout(false);
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
      <div className="grid grid-cols-2 md:flex md:flex-wrap lg:flex-nowrap gap-3 mb-8 w-full">
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

        <button
          onClick={() => setActiveTab("about")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-xs font-sans font-medium transition-all duration-300 cursor-pointer ${
            activeTab === "about"
              ? "bg-accent border-accent text-black"
              : "bg-white/3 border-white/5 text-white/60 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Homepage Settings</span>
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
              <div id="artwork-form-top" className="scroll-mt-24" />
              <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent" />
                <span>{editingArtworkId ? "Edit Artwork Details" : "Upload New Masterpiece"}</span>
                {editingArtworkId && (
                  <span className="text-xs uppercase tracking-widest font-sans font-semibold bg-amber-950 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded ml-auto">
                    Editing Mode
                  </span>
                )}
              </h2>

              {uploadSuccess && (
                <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/20 rounded flex items-center gap-2.5 text-xs text-emerald-400 font-sans">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Artwork catalog updated successfully!</span>
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

                  {/* Right Column: Files & Availability */}
                  <div className="space-y-5">
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
                            required={!isDemoMode && !editingArtworkId}
                            className="hidden"
                          />
                        </label>
                      </div>
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

                <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-white/5">
                  {editingArtworkId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-sans font-semibold rounded transition-all duration-300 text-sm cursor-pointer flex items-center justify-center"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full sm:w-auto px-6 py-3 bg-accent text-black font-sans font-semibold rounded hover:bg-opacity-90 transition-all duration-300 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <span>Saving Catalog Record...</span>
                    ) : (
                      <>
                        {editingArtworkId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{editingArtworkId ? "Save Artwork Updates" : "Add Artwork to Catalog"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Existing Artworks Catalog Section */}
              <div className="mt-12 border-t border-white/5 pt-8">
                <h3 className="text-lg font-serif text-white mb-6 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-accent" />
                  <span>Existing Artworks Catalog</span>
                </h3>

                {artworksLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : artworks.length === 0 ? (
                  <p className="text-xs text-white/30 font-sans font-light">No artworks uploaded yet in this environment.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {artworks.map((art) => (
                      <div key={art.id} className="flex gap-4 p-4 rounded-lg bg-white/2 border border-white/5 items-center justify-between">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-16 relative bg-neutral-900 rounded overflow-hidden border border-white/10 flex-shrink-0">
                            {art.finalImageUrl ? (
                              <img src={art.finalImageUrl} alt={art.title} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-white">{art.title}</h4>
                            <p className="text-[10px] text-white/50 font-sans mt-0.5">{art.medium} &bull; {art.year}</p>
                            <span className="inline-block text-[9px] uppercase tracking-wider bg-white/5 border border-white/10 text-white/60 px-1.5 py-0.5 rounded mt-1.5">
                              {art.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                            art.available ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" : "bg-red-950/40 text-red-400 border border-red-500/20"
                          }`}>
                            {art.available ? "Available" : "Acquired"}
                          </span>
                          <button
                            onClick={() => handleEditArtwork(art)}
                            className="p-2 text-white/40 hover:text-accent hover:bg-white/5 border border-transparent hover:border-white/10 rounded transition-all cursor-pointer"
                            title="Edit Artwork Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteArtwork(art.id)}
                            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/20 rounded transition-all cursor-pointer"
                            title="Delete Artwork"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                <span>Upload Review Screenshot</span>
              </h2>

              {feedbackSuccess && (
                <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/20 rounded flex items-center gap-2.5 text-xs text-emerald-400 font-sans">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Review screenshot published successfully!</span>
                </div>
              )}

              <form onSubmit={handleAddFeedback} className="space-y-6">
                <div className="max-w-xl space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-2 font-sans">
                      Select Review Screenshot *
                    </label>
                    <div className="flex flex-col items-center gap-4 p-6 border border-dashed border-white/15 rounded-lg bg-white/2">
                      {feedbackScreenshotFile ? (
                        <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-neutral-900 border border-white/10">
                          <Image
                            src={URL.createObjectURL(feedbackScreenshotFile)}
                            alt="Screenshot Preview"
                            fill
                            className="object-contain p-1"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-white/30 text-xs uppercase font-sans text-center px-4">
                          Drag screenshot here or click upload
                        </div>
                      )}
                      
                      <input
                        id="feedback-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFeedbackScreenshotFile(e.target.files[0]);
                          }
                        }}
                        required
                        className="text-xs text-white/50 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:uppercase file:font-semibold file:bg-accent file:text-black hover:file:bg-opacity-90 file:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-white/5">
                  <button
                    type="submit"
                    disabled={feedbackSubmitting}
                    className="px-6 py-3 bg-accent text-black font-sans font-semibold rounded hover:bg-opacity-90 transition-all duration-300 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feedbackSubmitting ? (
                      <span>Publishing Screenshot...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Publish Screenshot</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Published Client Feedback Section */}
              <div className="mt-12 border-t border-white/5 pt-8">
                <h3 className="text-lg font-serif text-white mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <span>Published Testimonials Showcase</span>
                </h3>

                {testimonialsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : testimonials.length === 0 ? (
                  <p className="text-xs text-white/30 font-sans font-light">No testimonials published yet in this environment.</p>
                ) : (
                  <div className="space-y-4">
                    {testimonials.map((t) => {
                      const reviewDate = t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Recent";
                      return (
                        <div key={t.id} className="p-4 rounded-lg bg-white/2 border border-white/5 flex justify-between items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-20 relative bg-neutral-900 rounded overflow-hidden border border-white/10 flex-shrink-0">
                              {t.screenshotUrl ? (
                                <img src={t.screenshotUrl} alt="Review Screenshot" className="object-contain w-full h-full p-1" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-white">Review Screenshot</h4>
                              <p className="text-[10px] text-white/40 font-sans mt-0.5">Uploaded on {reviewDate}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTestimonial(t.id)}
                            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/20 rounded transition-all cursor-pointer flex-shrink-0"
                            title="Delete Feedback"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === "about" ? (
            /* About Settings Form */
            <motion.div
              key="about-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel p-6 md:p-8 rounded-xl shadow-xl w-full"
            >
              <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                <span>Edit Homepage Settings</span>
              </h2>

              {saveAboutSuccess && (
                <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/20 rounded flex items-center gap-2.5 text-xs text-emerald-400 font-sans">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Homepage settings updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveAboutSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Form Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        Philosophical Heading / Title *
                      </label>
                      <input
                        type="text"
                        value={aboutTitle}
                        onChange={(e) => setAboutTitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans"
                        placeholder="e.g., Translating Devotion and Emotion into Fine Graphite Lines"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        Bio Paragraph 1 *
                      </label>
                      <textarea
                        value={aboutParagraph1}
                        onChange={(e) => setAboutParagraph1(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans resize-none leading-relaxed"
                        placeholder="Write first paragraph of biography..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        Bio Paragraph 2 *
                      </label>
                      <textarea
                        value={aboutParagraph2}
                        onChange={(e) => setAboutParagraph2(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans resize-none leading-relaxed"
                        placeholder="Write second paragraph of biography..."
                      />
                    </div>
                  </div>

                  {/* Right Column: Quote & Image */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        Philosophical Quote *
                      </label>
                      <textarea
                        value={aboutQuote}
                        onChange={(e) => setAboutQuote(e.target.value)}
                        required
                        rows={3}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:border-accent outline-none text-sm text-white font-sans resize-none leading-relaxed"
                        placeholder="e.g., An artist doesn't just draw what he sees..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                        About Profile Image
                      </label>
                      <div className="mt-1 flex flex-col items-center gap-4 p-4 border border-dashed border-white/15 rounded-lg bg-white/2 animate-pulse-slow">
                        {aboutImageUrl || aboutImageFile ? (
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-neutral-900 border border-white/10">
                            <Image
                              src={aboutImageFile ? URL.createObjectURL(aboutImageFile) : aboutImageUrl}
                              alt="About Profile Image Preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-white/30 text-[10px] uppercase font-sans">
                            No image
                          </div>
                        )}
                        
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAboutImageFile(e.target.files[0]);
                            }
                          }}
                          className="text-xs text-white/50 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:uppercase file:font-semibold file:bg-accent file:text-black hover:file:bg-opacity-90 file:cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                          Hero Frame 1 (Left)
                        </label>
                        <div className="mt-1 flex flex-col items-center gap-3 p-3 border border-dashed border-white/15 rounded-lg bg-white/2">
                          {heroLeftImageUrl || heroLeftImageFile ? (
                            <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-neutral-900 border border-white/10">
                              <Image
                                src={heroLeftImageFile ? URL.createObjectURL(heroLeftImageFile) : heroLeftImageUrl}
                                alt="Hero Left Image Preview"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-24 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-white/30 text-[9px] uppercase font-sans text-center px-1">
                              Default Frame 1
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setHeroLeftImageFile(e.target.files[0]);
                              }
                            }}
                            className="w-full text-[10px] text-white/50 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:uppercase file:font-semibold file:bg-accent file:text-black hover:file:bg-opacity-90 file:cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-sans">
                          Hero Frame 2 (Right)
                        </label>
                        <div className="mt-1 flex flex-col items-center gap-3 p-3 border border-dashed border-white/15 rounded-lg bg-white/2">
                          {heroRightImageUrl || heroRightImageFile ? (
                            <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-neutral-900 border border-white/10">
                              <Image
                                src={heroRightImageFile ? URL.createObjectURL(heroRightImageFile) : heroRightImageUrl}
                                alt="Hero Right Image Preview"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-24 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-white/30 text-[9px] uppercase font-sans text-center px-1">
                              Default Frame 2
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setHeroRightImageFile(e.target.files[0]);
                              }
                            }}
                            className="w-full text-[10px] text-white/50 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:uppercase file:font-semibold file:bg-accent file:text-black hover:file:bg-opacity-90 file:cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-white/5">
                  <button
                    type="submit"
                    disabled={savingAbout}
                    className="px-6 py-3 bg-accent text-black font-sans font-semibold rounded hover:bg-opacity-90 transition-all duration-300 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingAbout ? (
                      <span>Saving Settings...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Save Homepage Settings</span>
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
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-mono text-white/30">
                            {inq.createdAt ? new Date(inq.createdAt.seconds * 1000).toLocaleString() : "Date Unavailable"}
                          </span>
                          <button
                            onClick={() => handleDeleteInquiry(inq.id)}
                            className="p-1 text-white/40 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/20 rounded transition-all cursor-pointer"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
