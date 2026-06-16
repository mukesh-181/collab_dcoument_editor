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
  const [selectedIcon, setSelectedIcon] = useState('📝')
  const router = useRouter()

  // Kept only relevant document icons
  const icons = ['📝', '📄', '📘', '📓', '🗒️', '📁', '📊']

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Prepend the icon to the title so it's visible before the title in the card
    const title = formData.get('title') as string
    formData.set('title', `${selectedIcon} ${title}`)
    
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
      <DialogContent className="sm:max-w-[480px] p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Create a new document</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              Give it a title and pick an icon. You can change these later.
            </DialogDescription>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Untitled"
                className="h-11 px-3.5 text-[15px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-indigo-500 shadow-sm"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                Icon
              </Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl text-xl transition-all ${
                      selectedIcon === icon
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/30 dark:border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.1)] dark:shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                        : 'border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="rounded-xl h-10 px-4 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors font-semibold"
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={isPending}
              className="relative bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-xl h-10 px-5 font-semibold transition-all border-0"
            >
              <span className={isPending ? "opacity-0" : ""}>Create document</span>
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
