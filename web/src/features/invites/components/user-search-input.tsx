'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { searchUsersByEmail } from "../actions/search-users.action";
import { getInitials } from "@/utils/string-utils";
import { getUserName, getUserImage, getUserEmail, getUserRole, USER_FALLBACKS } from "@/utils/user-utils";



export interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface SelectedContact {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isCustom?: boolean;
}

interface UserSearchInputProps {
  selectedContacts: SelectedContact[];
  onContactsChange: (contacts: SelectedContact[]) => void;
  emailQuery: string;
  onEmailQueryChange: (email: string) => void;
  allMembers?: any[];
  invites?: any[];
}

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export function UserSearchInput({ 
  selectedContacts,
  onContactsChange,
  emailQuery,
  onEmailQueryChange,
  allMembers = [],
  invites = []
}: UserSearchInputProps) {
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep a mutable ref of selectedContacts to prevent stale closures during async operations
  const selectedContactsRef = useRef(selectedContacts);
  useEffect(() => {
    selectedContactsRef.current = selectedContacts;
  }, [selectedContacts]);

  useEffect(() => {
    if (!emailQuery || emailQuery.length < 2) {
      setResults([]);
      setIsDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const users = await searchUsersByEmail(emailQuery);
        // Filter out users already selected
        const filteredUsers = users.filter(u => !selectedContacts.some(sc => sc.email === u.email));
        setResults(filteredUsers);
        setIsDropdownOpen(true);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [emailQuery, selectedContacts]);

  const handleAddCustomEmail = async () => {
    const rawEmails = emailQuery.split(/[,\s]+/).map(e => e.trim()).filter(Boolean);
    let newContacts: SelectedContact[] = [];
    
    for (const trimmed of rawEmails) {
      const isMem = allMembers.some(m => m.user?.email?.toLowerCase() === trimmed.toLowerCase());
      const isInv = invites.some(inv => inv.status === 'pending' && inv.email?.toLowerCase() === trimmed.toLowerCase() && new Date(inv.expires_at) > new Date());
      
      if (isValidEmail(trimmed) && !selectedContactsRef.current.some(c => c.email === trimmed) && !newContacts.some(c => c.email === trimmed) && !isMem && !isInv) {
        // Try to find a matching registered user from our current search results
        let matchedUser = results.find(u => u.email.toLowerCase() === trimmed.toLowerCase());
        
        // If they hit Enter instantly, the debounce hasn't finished. Do a quick DB check!
        if (!matchedUser) {
          setIsSearching(true);
          try {
            const dbCheck = await searchUsersByEmail(trimmed);
            matchedUser = dbCheck.find(u => u.email.toLowerCase() === trimmed.toLowerCase());
          } catch (error) {
            console.error(error);
          } finally {
            setIsSearching(false);
          }
        }
        
        if (matchedUser) {
          newContacts.push(matchedUser);
        } else {
          newContacts.push({ id: crypto.randomUUID(), email: trimmed, name: null, image: null, isCustom: true });
        }
      }
    }
    
    if (newContacts.length > 0) {
      onEmailQueryChange("");
      setResults([]);
      setIsDropdownOpen(false);
      onContactsChange([...selectedContactsRef.current, ...newContacts]);
    } else if (rawEmails.length === 1 && isValidEmail(rawEmails[0])) {
      // If it was a single valid email but already selected, just clear input
      onEmailQueryChange("");
      setResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddCustomEmail();
    } else if (e.key === 'Backspace' && emailQuery === '' && selectedContacts.length > 0) {
      // Remove last selected contact if backspace is pressed on empty input
      onContactsChange(selectedContacts.slice(0, -1));
    }
  };

  const removeContact = (idToRemove: string) => {
    onContactsChange(selectedContacts.filter(c => c.id !== idToRemove));
  };

  const handleUserSelect = (user: UserSearchResult) => {
    if (!selectedContacts.some(c => c.email === user.email)) {
      onContactsChange([...selectedContacts, user]);
    }
    onEmailQueryChange("");
    setResults([]);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div 
        className="flex flex-wrap items-center gap-1.5 min-h-[44px] p-1.5 rounded-lg border border-zinc-200 focus-within:ring-1 focus-within:ring-zinc-400 dark:border-zinc-700 dark:focus-within:ring-zinc-600 shadow-sm bg-white dark:bg-zinc-950 transition-shadow cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedContacts.length === 0 && !emailQuery && (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        )}
        
        {selectedContacts.map((contact) => (
          <div 
            key={contact.id} 
            className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-md max-w-full"
          >
            {contact.isCustom ? (
              <div className="h-5 w-5 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                {contact.email.charAt(0).toUpperCase()}
              </div>
            ) : (
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={contact.image || undefined} />
                <AvatarFallback className="text-[10px] font-medium">
                  {(contact.name || contact.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
              {contact.name || contact.email.split('@')[0]}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeContact(contact.id);
              }}
              className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors text-zinc-500"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <div className="flex-1 min-w-[120px] relative flex items-center">
          <input
            ref={inputRef}
            type="email"
            placeholder={selectedContacts.length === 0 ? "colleague@example.com" : ""}
            value={emailQuery}
            onChange={(e) => onEmailQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setIsDropdownOpen(true);
            }}
            onBlur={() => {
              // Delay closing so click events on dropdown items can fire
              setTimeout(() => {
                setIsDropdownOpen(false);
                // Automatically convert to pill on blur if valid email
                handleAddCustomEmail();
              }, 200);
            }}
            className={`w-full h-8 text-[15px] bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 ${
              selectedContacts.length === 0 ? "pl-7" : "pl-1"
            }`}
          />
          {isSearching && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 animate-spin" />
          )}
        </div>
      </div>

      {isDropdownOpen && results.length > 0 && (
        <div 
          className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-y-auto py-1 max-h-[400px] custom-scrollbar"
        >
          {results.map((user) => {
            const isMem = allMembers.some(m => m.user?.email?.toLowerCase() === user.email.toLowerCase());
            const isInv = invites.some(inv => inv.status === 'pending' && inv.email?.toLowerCase() === user.email.toLowerCase() && new Date(inv.expires_at) > new Date());
            const isDisabled = isMem || isInv;

            return (
              <button
                key={user.id}
                type="button"
                disabled={isDisabled}
                onMouseDown={(e) => {
                  // Prevent focus from leaving the input so onBlur doesn't fire prematurely
                  e.preventDefault();
                  if (!isDisabled) {
                    handleUserSelect(user);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  isDisabled ? "opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/50" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <Avatar className={`h-8 w-8 shrink-0 border border-zinc-200 dark:border-zinc-800 ${isDisabled ? 'grayscale' : ''}`}>
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback className="text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {getUserName(user.name, user.email)}
                  </span>
                  <span className="text-[11px] text-zinc-500 truncate">{user.email}</span>
                </div>
                {isMem && (
                  <span className="text-[10px] shrink-0 bg-zinc-200/50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-medium">
                    Member
                  </span>
                )}
                {isInv && (
                  <span className="text-[10px] shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                    Invited
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
