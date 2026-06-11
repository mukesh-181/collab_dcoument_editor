"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DUMMY_INBOX_ITEMS = [
  {
    id: 1,
    sender: "Alex Morgan",
    avatar: "https://i.pravatar.cc/150?u=alex",
    subject: "System Update: Scheduled Maintenance",
    snippet: "Our servers will undergo maintenance on October 31, 2024, from 1 AM to 3 AM. E...",
    time: "08:43 PM",
  },
  {
    id: 2,
    sender: "Jamie Nguyen",
    avatar: "https://i.pravatar.cc/150?u=jamie",
    subject: "Weekly Dev Team Meeting",
    snippet: "Reminder: Join our weekly dev team meeting to discuss progress and blockers.",
    time: "07:18 PM",
  },
  {
    id: 3,
    sender: "Taylor Chen",
    avatar: "https://i.pravatar.cc/150?u=taylor",
    subject: "Beta Testing: New Features Available",
    snippet: "Be the first to try out the new features and provide feedback to help us improve t...",
    time: "04:16 PM",
  },
  {
    id: 4,
    sender: "Chris Patel",
    avatar: "https://i.pravatar.cc/150?u=chris",
    subject: "Tech Conference Invite: Innovations in AI",
    snippet: "Join us at the Innovations in AI conference for insights on the latest developments.",
    time: "03:15 PM",
  },
  {
    id: 5,
    sender: "Morgan Wright",
    avatar: "https://i.pravatar.cc/150?u=morgan",
    subject: "Security Alert: Update Your Credentials",
    snippet: "Please ensure your account is secure by updating your password and enabling t...",
    time: "11:16 AM",
  }
];

export function InboxList() {
  return (
    <div className="flex flex-col w-full h-full max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Inbox</h1>
      
      <div className="flex flex-col">
        {DUMMY_INBOX_ITEMS.map((item) => (
          <div 
            key={item.id} 
            className="flex gap-4 py-4 px-2 border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors group"
          >
            <Avatar className="w-10 h-10 shrink-0 border border-zinc-200 dark:border-zinc-800">
              <AvatarImage src={item.avatar} alt={item.sender} />
              <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                {item.sender.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1 gap-4">
                <span className="font-semibold text-[15px] text-zinc-900 dark:text-zinc-100 truncate">
                  {item.sender}
                </span>
                <span className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 shrink-0 mt-0.5">
                  {item.time}
                </span>
              </div>
              <span className="text-[14px] text-zinc-700 dark:text-zinc-300 mb-0.5 truncate">
                {item.subject}
              </span>
              <span className="text-[14px] text-zinc-500 dark:text-zinc-400 truncate">
                {item.snippet}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
