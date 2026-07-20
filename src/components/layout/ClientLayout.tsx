"use client";

import React, { useState } from "react";
import Header from "./Header";
import NavSheet from "./NavSheet";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/30 dark:bg-black text-black dark:text-zinc-100">
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col">
        {children}
      </main>
      <NavSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
