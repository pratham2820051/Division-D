"use client";

import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ConversationSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ConversationSearch({
  value,
  onChange,
  className,
}: ConversationSearchProps) {
  return (
    <div className={cn("relative px-3", className)}>
      <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chats..."
        className="h-9 rounded-lg bg-background pl-9 pr-8 text-sm"
        aria-label="Search conversations"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
