import { cn } from "@/lib/utils";
import type { MessageRole } from "@/types/conversation";

interface ChatAvatarProps {
  role: MessageRole;
  className?: string;
}

export function ChatAvatar({ role, className }: ChatAvatarProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-xs font-bold",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-emerald-700 text-white",
        className,
      )}
      aria-hidden
    >
      {isUser ? "U" : "PM"}
    </div>
  );
}
