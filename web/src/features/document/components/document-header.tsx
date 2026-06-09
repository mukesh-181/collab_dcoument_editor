'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Cloud, CloudOff, CloudUpload, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useDocumentSync } from './document-context'
import { updateDocumentTitle } from '@/features/dashboard/actions/document.actions'
import { toast } from 'sonner'
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

interface DocumentHeaderProps {
  document: {
    id: string
    title: string
    updated_at: string
  }
}

export function DocumentHeader({ document }: DocumentHeaderProps) {
  const { syncState } = useDocumentSync()
  const [title, setTitle] = useState(document.title)
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [draftTitle, setDraftTitle] = useState(document.title)

  const handleTitleChange = async (formData: FormData) => {
    const newTitle = (formData.get('title') as string) || title
    if (newTitle.trim() === document.title || newTitle.trim() === '') {
      setOpen(false)
      return
    }

    setIsPending(true)
    try {
      await updateDocumentTitle(document.id, newTitle)
      setTitle(newTitle)
      setOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update title')
    } finally {
      setIsPending(false)
    }
  }

  // Handle dialog opening to reset the draft title
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setDraftTitle(title)
    }
  }

  const isSaveDisabled = isPending || draftTitle.trim() === '' || draftTitle.trim() === title

  return (
    <div className="flex items-center justify-between h-14 pr-4 pl-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <div className="flex flex-col ml-1">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate max-w-[200px] sm:max-w-[400px]">
              {title}
            </h1>
            
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50">
                  <Pencil className="h-3 w-3" />
                  <span className="sr-only">Rename document</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form action={handleTitleChange}>
                  <DialogHeader>
                    <DialogTitle>Rename Document</DialogTitle>
                    <DialogDescription>
                      Enter a new name for your document.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="col-span-3"
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaveDisabled}>
                      {isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center gap-1.5 mt-0.5">
            {syncState === 'saving' && (
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                <CloudUpload className="h-3 w-3 animate-pulse" />
                <span>Saving...</span>
              </div>
            )}
            {syncState === 'saved' && (
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                <Cloud className="h-3 w-3" />
                <span>Saved</span>
              </div>
            )}
            {syncState === 'offline' && (
              <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500">
                <CloudOff className="h-3 w-3" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
