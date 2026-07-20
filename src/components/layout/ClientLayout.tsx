"use client";

import React, { useState } from "react";
import Header from "./Header";
import NavSheet from "./NavSheet";
import { Menu } from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/30 dark:bg-black text-black dark:text-zinc-100 relative pb-20 md:pb-0">
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col">
        {children}
      </main>

      {/* Floating Bottom Center Hamburger Menu Button on Mobile */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setMenuOpen(true)}
          className="btn-interactive flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-2xl border border-border text-xs font-extrabold cursor-pointer select-none"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </div>

      <NavSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
