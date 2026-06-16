"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OAuthButtons } from "./oauth-buttons";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

export function AuthTabs({
  next,
  defaultTab,
}: {
  next?: string;
  defaultTab?: string;
}) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    defaultTab === "register" ? "register" : "login"
  );

  return (
    <Card className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/50 p-2 sm:p-4">
      <CardHeader className="space-y-2 text-center pb-6">
        <CardTitle className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-serif">
          {activeTab === "login" ? "Welcome back" : "Create an account"}
        </CardTitle>
        <CardDescription className="text-base text-zinc-500 dark:text-zinc-400">
          {activeTab === "login"
            ? "Enter your details to access your account"
            : "Sign up to start collaborating in real-time"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <OAuthButtons />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full border-zinc-200 dark:border-zinc-800/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-medium tracking-wider">
            <span className="bg-white/60 px-3 text-zinc-500 backdrop-blur-md dark:bg-zinc-950/50 dark:text-zinc-400 rounded-full">
              Or continue with email
            </span>
          </div>
        </div>

        {activeTab === "login" ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <LoginForm next={next} />
            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Don't have an account?{" "}
              <button
                onClick={() => setActiveTab("register")}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline-offset-4 hover:underline transition-all"
              >
                Sign up
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <RegisterForm next={next} />
            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <button
                onClick={() => setActiveTab("login")}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline-offset-4 hover:underline transition-all"
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
