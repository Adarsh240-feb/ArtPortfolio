"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Paintbrush, Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { name: "About", href: "about" },
    { name: "Gallery", href: "gallery" },
    { name: "Contact", href: "contact" },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      e.preventDefault();
      router.push(`/#${targetId}`);
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-[2px] transition-all duration-300">
        <div className="max-w-[92vw] xl:max-w-[85vw] mx-auto px-6 md:px-16 h-24 flex items-center justify-between">
          
          {/* Logo Section - Generic Template logo */}
          <Link 
            href="/" 
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/";
            }}
            className="flex items-center gap-1.5 group cursor-pointer"
          >
            <span className="text-lg sm:text-xl md:text-2xl font-serif text-[#f4edd2] tracking-wide group-hover:text-accent transition-colors duration-300">
              Life of Ritik <span className="font-sans text-xs text-white/50 lowercase hidden sm:inline-block">| Artworks</span>
            </span>
            <Paintbrush className="w-3.5 h-3.5 text-accent animate-pulse" />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-10">
            {links.map((link) => {
              return (
                <a
                  key={link.name}
                  href={`/#${link.href}`}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-xs uppercase tracking-[0.2em] font-medium font-sans text-white/60 hover:text-white transition-colors duration-300 cursor-pointer"
                >
                  {link.name}
                </a>
              );
            })}

            {/* Commission Button */}
            <a
              href="#contact"
              onClick={(e) => handleLinkClick(e, "contact")}
              className="px-6 py-2.5 border border-accent/40 text-accent hover:bg-accent hover:text-black transition-all duration-300 rounded font-sans text-xs uppercase tracking-widest font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Commission</span>
              <ArrowRight className="w-3 h-3" />
            </a>

          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>

        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 bg-black/95 backdrop-blur-lg flex flex-col justify-center items-center p-8 md:hidden"
          >
            {/* Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-8 right-6 p-2 text-white/70 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Menu Links */}
            <div className="flex flex-col gap-8 text-center">
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  window.location.href = "/";
                }}
                className="text-2xl font-serif text-[#f4edd2] mb-4 text-center"
              >
                Life of Ritik | Artworks
              </Link>

              {links.map((link) => {
                return (
                  <a
                    key={link.name}
                    href={`/#${link.href}`}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-lg uppercase tracking-[0.2em] font-sans font-medium text-white/60 hover:text-white cursor-pointer"
                  >
                    {link.name}
                  </a>
                );
              })}

              <a
                href="#contact"
                onClick={(e) => handleLinkClick(e, "contact")}
                className="mt-6 px-8 py-3 bg-accent text-black uppercase tracking-[0.2em] font-semibold text-xs rounded font-sans cursor-pointer text-center"
              >
                Inquire Commission
              </a>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
