"use client";

import { useState } from "react";

import { ChatHeader } from "@/components/chat/layout/ChatHeader";
import { ConversationSidebar } from "@/components/chat/sidebar/ConversationSidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border transition-all duration-300 md:block",
          sidebarOpen ? "w-[300px]" : "w-0 overflow-hidden border-r-0",
        )}
      >
        <ConversationSidebar />
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="sr-only">Chat sidebar</SheetTitle>
          <ConversationSidebar onSelect={closeMobileSidebar} onNewChat={closeMobileSidebar} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatHeader
          showMobileMenu
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setMobileSidebarOpen(true);
            } else {
              setSidebarOpen((prev) => !prev);
            }
          }}
        />
        {children}
      </div>
    </div>
  );
}
