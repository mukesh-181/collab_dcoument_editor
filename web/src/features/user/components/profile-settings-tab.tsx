"use client";

import { useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "../schemas/user.schema";
import { updateProfile } from "../actions/update-profile.action";
import { uploadAvatar } from "../actions/upload-avatar.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

import { extractUserInfo } from "@/utils/user-utils";

export function ProfileSettingsTab({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { name: fullName, image: currentAvatarUrl } = extractUserInfo(user);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: fullName,
      avatar_url: currentAvatarUrl,
    },
  });

  const watchedAvatarUrl = useWatch({
    control: form.control,
    name: "avatar_url",
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be less than 2MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPendingFile(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function onSubmit(data: UpdateProfileInput) {
    setIsLoading(true);
    try {
      let finalAvatarUrl = data.avatar_url;

      if (pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile);
        const uploadResult = await uploadAvatar(formData);

        if (uploadResult.error || !uploadResult.publicUrl) {
          toast.error(uploadResult.error || "Failed to upload image");
          setIsLoading(false);
          return;
        }
        finalAvatarUrl = uploadResult.publicUrl;
      }

      const updateData = { ...data, avatar_url: finalAvatarUrl };
      const result = await updateProfile(updateData);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
      } else {
        const finishSubmit = () => {
          form.reset(updateData);
          setPendingFile(null);
          setPreviewUrl(null);
          toast.success("Profile updated successfully!");
          setIsLoading(false);
        };

        if (pendingFile && finalAvatarUrl) {
          const img = new Image();
          img.src = finalAvatarUrl;
          img.onload = finishSubmit;
          img.onerror = finishSubmit;
        } else {
          finishSubmit();
        }
      }
    } catch {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            My Profile
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage your profile details and avatar.
          </p>
        </div>
        <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 rounded-md px-3 py-1 shadow-sm">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
            Base
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div
          className="relative group cursor-pointer"
          onClick={handleAvatarClick}
        >
          <Avatar className="h-24 w-24 border-2 border-zinc-200 dark:border-zinc-800">
            <AvatarImage
              src={previewUrl || watchedAvatarUrl || currentAvatarUrl}
            />
            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-2xl">
              {fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
            <Camera className="h-6 w-6" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Profile Picture
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Recommended: 256x256px. Max 2MB.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Email Address
          </label>
          <Input
            value={user.email}
            disabled
            className="bg-zinc-50 dark:bg-zinc-900/70 text-zinc-900"
          />
          <p className="text-xs text-zinc-500/80 dark:text-zinc-300/80">
            Your email address cannot be changed.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Your Username"
                      disabled={isLoading}
                      className="dark:bg-zinc-950"
                    />
                  </FormControl>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    This is your public display name. (Note: Future limit of 3
                    changes per month).
                  </p>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading || (!form.formState.isDirty && !pendingFile)}
              className="relative bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <span className={isLoading ? "opacity-0" : "opacity-100"}>
                Save Changes
              </span>
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
