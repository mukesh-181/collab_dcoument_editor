'use client'

import { useState } from 'react'
import { Plus, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createDocument } from '../../actions/create-document.action'

import { useRouter } from 'next/navigation'
import { ROUTES } from "@/constants/routes";

export function CreateDocumentButton({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setIsPending(true)
    try {
      const newDocId = await createDocument(formData)
      setOpen(false)
      router.push(ROUTES.DOCUMENT(newDocId))
    } catch (error) {
      console.error(error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
          <Button variant="ghost" className="w-full justify-start text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium h-9 px-3 rounded-xl transition-all">
            <Plus className="mr-2.5 h-[16px] w-[16px]" />
            <span className="text-[13px]">New Document</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-6 border-b border-zinc-100 dark:border-zinc-800">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div className="text-left">
                  <DialogTitle className="text-xl font-semibold">Create New Document</DialogTitle>
                  <DialogDescription className="mt-1.5 -ml-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-1 rounded-md inline-block">
                    Give your new document a title. You can always change it later.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Document Title
              </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue="Untitled Document"
                  onFocus={(e) => e.target.select()}
                  className="h-11 px-4 text-[15px] rounded-xl border-zinc-200/60 focus-visible:ring-indigo-500/50 dark:border-zinc-800/60 dark:focus-visible:ring-indigo-500/50 shadow-sm bg-white/50 dark:bg-zinc-950/50"
                  autoFocus
                  required
                />
            </div>
          </div>
          
          <DialogFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="rounded-lg h-10 px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </Button>
            
            <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1 hidden sm:block" />
            
            <Button 
              type="submit" 
              disabled={isPending}
              className="relative bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-md rounded-xl h-10 px-6 font-medium transition-all hover:-translate-y-0.5"
            >
              <span className={isPending ? "opacity-0" : ""}>Create Document</span>
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
