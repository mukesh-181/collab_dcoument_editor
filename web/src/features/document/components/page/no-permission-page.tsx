"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export function NoPermissionPage() {
  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-zinc-950 items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl p-8 max-w-sm w-full flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Access Denied
        </h1>
        
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8">
          You have no permission to access this document. The document might not exist, or your access may have been revoked by the owner.
        </p>

        <Button asChild className="w-full">
          <Link href={ROUTES.DASHBOARD}>Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
