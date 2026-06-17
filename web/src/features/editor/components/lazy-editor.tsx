"use client";

import dynamic from "next/dynamic";

export const LazyEditor = dynamic(
  () => import("./editor").then((mod) => mod.Editor),
  { ssr: false }
);

export const preloadEditor = () => {
  void import("./editor");
};
