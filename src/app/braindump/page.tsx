"use client";

import React, { useEffect } from "react";
import { useBrainDumpStore } from "@/store/braindump-store";
import BrainDumpView from "@/components/braindump/BrainDumpView";

export default function BrainDumpPage() {
  const { fetchIdeas } = useBrainDumpStore();

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  return <BrainDumpView />;
}
