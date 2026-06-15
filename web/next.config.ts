import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   allowedDevOrigins: ['192.168.0.164'],
   serverExternalPackages: ["yjs", "y-protocols", "y-prosemirror"],
};

export default nextConfig;

// Force restart to clear Turbopack cache and load Tiptap extensions
