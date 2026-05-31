"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, Volume2, VolumeX } from "lucide-react";

import { TranslationDropdown } from "@/components/translation/TranslationDropdown";
import { Button } from "@/components/ui/button";
import { useConversations } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  onToggleSidebar?: () => void;
  showMobileMenu?: boolean;
  sidebarOpen?: boolean;
  className?: string;
}

export function ChatHeader({
  onToggleSidebar,
  showMobileMenu = false,
  sidebarOpen = true,
  className,
}: ChatHeaderProps) {
  const { language, setLanguage, autoPlayResponses, setAutoPlayResponses } =
    useConversations();

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-auto min-h-14 shrink-0 flex-wrap items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-4 md:px-6",
        className,
      )}
    >
      {showMobileMenu && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeftOpen className="h-5 w-5" />
        )}
      </Button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white shadow-sm">
          PM
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold md:text-base">
            PashuMitra AI
          </h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            Livestock Health Assistant
          </p>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
        <TranslationDropdown
          value={language}
          onChange={setLanguage}
          className="min-w-0 flex-1 sm:flex-none"
        />
        <Button
          type="button"
          variant={autoPlayResponses ? "default" : "outline"}
          size="sm"
          className="h-9 gap-1.5 shrink-0"
          onClick={() => setAutoPlayResponses(!autoPlayResponses)}
          aria-pressed={autoPlayResponses}
          aria-label="Auto play assistant responses"
        >
          {autoPlayResponses ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
          <span className="hidden xs:inline sm:inline">Auto voice</span>
        </Button>
      </div>
    </header>
  );
}
