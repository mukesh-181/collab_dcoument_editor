"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Pencil, Eye, MoreVertical, ShieldAlert, UserMinus, ShieldCheck, Crown, Loader2 } from "lucide-react";
import { useTransition, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { removeMemberAction } from "../../actions/remove-member.action";
import { updateMemberRoleAction } from "../../actions/update-member-role.action";
import { toast } from "sonner";
import { getInitials } from "@/utils/string-utils";
import { extractUserInfo } from "@/utils/user-utils";
import { RemoveMemberDialog } from "./remove-member-dialog";


interface DocumentMembersPopoverProps {
  members?: {
    role: string;
    user: {
      id: string;
      name: string;
      image: string;
      email: string;
    };
  }[];
  documentId: string;
  currentUserRole?: string;
}

export function DocumentMembersPopover({ members, documentId, currentUserRole }: DocumentMembersPopoverProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [pendingAction, setPendingAction] = useState<{ memberId: string, type: 'editor' | 'viewer' | 'remove' } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [removeDialogData, setRemoveDialogData] = useState<{ isOpen: boolean, memberId: string, memberEmail: string, memberName: string } | null>(null);

  const handleRoleUpdate = (memberId: string, memberEmail: string, newRole: string) => {
    setPendingAction({ memberId, type: newRole as 'editor' | 'viewer' });
    startTransition(async () => {
      const result = await updateMemberRoleAction(documentId, memberId, memberEmail, newRole);
      setPendingAction(null);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Role updated to ${newRole}`);
        setOpenMenuId(null);
      }
    });
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    const result = await removeMemberAction(documentId, memberId, memberEmail);
    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error);
    } else {
      toast.success("Member removed successfully");
      setOpenMenuId(null);
    }
  };
  if (!members || members.length === 0) return null;

  // Pin the owner to the top of the list, followed by editors, then viewers
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder: Record<string, number> = { owner: 0, editor: 1, viewer: 2 };
    return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
  });

  return (
    <Popover 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setOpenMenuId(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button className="flex items-center -space-x-2 mr-2 focus:outline-none cursor-pointer group">
          {sortedMembers.map((member) => {
            const { name, image, email } = extractUserInfo(member.user);
            return (
              <Avatar
                key={member.user.id}
                className="w-8 h-8 border-2 border-white dark:border-zinc-950 transition-transform group-hover:scale-105"
              >
                <AvatarImage
                  src={image}
                  alt={name}
                />
                <AvatarFallback className="text-[10px]">
                  {getInitials(name, email)}
                </AvatarFallback>
              </Avatar>
            );
          })}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-80 p-0 shadow-lg rounded-xl overflow-hidden border-zinc-200 dark:border-zinc-800"
      >
        <div className="bg-zinc-50/80 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 dark:border-zinc-800 backdrop-blur-sm flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0">
            <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
              Document Members
            </h3>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {members.length} people have access
            </p>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
          {sortedMembers.map((member) => {
            const { name, image, email } = extractUserInfo(member.user);
            return (
            <div
              key={member.user.id}
              className="flex items-center justify-between p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-sm">
                  <AvatarImage
                    src={image}
                    alt={name}
                  />
                  <AvatarFallback>
                    {getInitials(name, email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[14px] font-medium text-zinc-900 dark:text-zinc-50 truncate leading-snug">
                    {name}
                  </span>
                  <span className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate leading-snug">
                    {email}
                  </span>
                </div>
              </div>
              {member.role === "owner" ? (
                <div className="ml-3 shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-400/15 text-purple-500 border border-purple-500/30 cursor-default select-none">
                  <Crown className="h-3 w-3" />
                  <span className="text-[11px] font-medium capitalize">
                    {member.role}
                  </span>
                </div>
              ) : member.role === "editor" ? (
                <div className="ml-3 shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-400/15 text-blue-500 border border-blue-500/30 cursor-default select-none">
                  <Pencil className="h-3 w-3" />
                  <span className="text-[11px] font-medium capitalize">
                    {member.role}
                  </span>
                </div>
              ) : (
                <div className="ml-3 shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-400/15 text-gray-500 border border-gray-500/30 cursor-default select-none">
                  <Eye className="h-3 w-3" />
                  <span className="text-[11px] font-medium capitalize">
                    {member.role}
                  </span>
                </div>
              )}
              
              {currentUserRole === "owner" && member.role !== "owner" && (
                <div className="ml-2">
                  <DropdownMenu open={openMenuId === member.user.id} onOpenChange={(isOpen) => setOpenMenuId(isOpen ? member.user.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <button 
                        disabled={isPending}
                        className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors focus:outline-none disabled:opacity-50"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {member.role === 'viewer' && (
                        <DropdownMenuItem 
                          disabled={isPending}
                          onSelect={(e) => {
                            e.preventDefault();
                            if (!isPending) handleRoleUpdate(member.user.id, member.user.email, 'editor');
                          }}
                        >
                          {pendingAction?.memberId === member.user.id && pendingAction.type === 'editor' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="mr-2 h-4 w-4" />
                          )}
                          <span>Make Editor</span>
                        </DropdownMenuItem>
                      )}
                      {member.role === 'editor' && (
                        <DropdownMenuItem 
                          disabled={isPending}
                          onSelect={(e) => {
                            e.preventDefault();
                            if (!isPending) handleRoleUpdate(member.user.id, member.user.email, 'viewer');
                          }}
                        >
                          {pendingAction?.memberId === member.user.id && pendingAction.type === 'viewer' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldAlert className="mr-2 h-4 w-4" />
                          )}
                          <span>Make Viewer</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        disabled={isPending}
                        onSelect={(e) => {
                          e.preventDefault();
                          setRemoveDialogData({
                            isOpen: true,
                            memberId: member.user.id,
                            memberEmail: email,
                            memberName: name
                          });
                        }}
                        className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        <span>Remove Access</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          )})}
        </div>
      </PopoverContent>
      {removeDialogData && (
        <RemoveMemberDialog
          isOpen={removeDialogData.isOpen}
          setIsOpen={(isOpen) => setRemoveDialogData(prev => prev ? { ...prev, isOpen } : null)}
          memberName={removeDialogData.memberName}
          onConfirm={() => handleRemove(removeDialogData.memberId, removeDialogData.memberEmail)}
        />
      )}
    </Popover>
  );
}
