import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewChatButtonProps {
  onClick: () => void;
  className?: string;
}

export function NewChatButton({ onClick, className }: NewChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={cn(
        "h-10 w-full justify-start gap-2 rounded-lg border-sidebar-border bg-background font-normal shadow-sm hover:bg-sidebar-accent",
        className,
      )}
    >
      <Plus className="h-4 w-4" />
      New chat
    </Button>
  );
}
