'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
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

export function SignOutButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium h-8 px-3">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg">
        <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <LogOut className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-semibold">Sign Out</DialogTitle>
                <DialogDescription className="mt-1.5 -ml-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-1 rounded-md inline-block">
                  Are you sure you want to log out?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <p className="text-[15px] text-zinc-700 dark:text-zinc-300">
            You will need to log back in to access your documents and collaborations.
          </p>
        </div>
        
        <DialogFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            className="rounded-lg h-10 px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </Button>
          
          <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1 hidden sm:block" />
          
          <form action={logout}>
            <Button 
              type="submit" 
              disabled={isPending}
              onClick={() => setIsPending(true)}
              className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm rounded-lg h-10 px-6 font-medium"
            >
              {isPending ? 'Signing out...' : 'Sign Out'}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
