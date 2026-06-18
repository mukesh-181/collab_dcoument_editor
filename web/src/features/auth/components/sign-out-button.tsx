'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { logout } from '@/features/auth/actions/logout.action'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean } = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSignOut = async () => {
    setIsPending(true)
    await logout()
    // Note: We don't set setIsPending(false) because logout() triggers a page redirect.
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            <LogOut className="h-[18px] w-[18px]" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium h-8 px-3">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        )}
      </DialogTrigger>
      <SignOutDialogContent isOpen={isOpen} setIsOpen={setIsOpen} isPending={isPending} onConfirm={handleSignOut} />
    </Dialog>
  )
}

export function SignOutDialogContent({ setIsOpen, isPending, onConfirm }: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border rounded-2xl shadow-2xl">
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-semibold">Sign Out</DialogTitle>
                <DialogDescription className="mt-1.5 text-[13px] font-medium text-muted-foreground">
                  Are you sure you want to log out?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <p className="text-[15px] text-foreground">
            You will need to log back in to access your documents and collaborations.
          </p>
        </div>
        
        <DialogFooter className="p-4 flex items-center justify-end gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            className="rounded-lg h-10 px-4 hover:bg-accent transition-colors"
          >
            Cancel
          </Button>
          
          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
          
          <Button 
            type="button" 
            disabled={isPending}
            onClick={onConfirm}
            className="relative bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl h-10 px-6 font-medium transition-all hover:-translate-y-0.5"
          >
            <span className={isPending ? "opacity-0" : ""}>Sign Out</span>
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
  )
}
