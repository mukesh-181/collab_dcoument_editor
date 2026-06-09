'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDocumentSync } from '@/features/document/components/document-context'
import { createInviteLink } from '../actions/invite.actions'

export function ShareDialog({ documentId }: { documentId: string }) {
  const { syncState } = useDocumentSync()
  const [isOpen, setIsOpen] = useState(false)
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer')
  const [inviteLink, setInviteLink] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState('')

  const isSavePending = syncState !== 'saved'

  const handleCreateLink = async () => {
    setIsLoading(true)
    setError('')
    try {
      const token = await createInviteLink(documentId, role)
      const url = new URL(`/invite?token=${token}`, window.location.origin)
      setInviteLink(url.toString())
    } catch (err: any) {
      setError(err.message || 'Failed to create invite link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const resetState = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setTimeout(() => {
        setInviteLink('')
        setError('')
        setRole('viewer')
      }, 300) // reset after animation
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetState}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isSavePending}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Create a one-time invite link to add a collaborator.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-500 font-medium">{error}</div>
        )}

        {!inviteLink ? (
          <div className="flex items-center gap-2 mt-4">
            <Select value={role} onValueChange={(val: 'viewer' | 'editor') => setRole(val)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateLink} disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Link
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-4">
            <Input
              readOnly
              value={inviteLink}
              className="flex-1"
            />
            <Button size="icon" variant="secondary" onClick={handleCopy}>
              {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
