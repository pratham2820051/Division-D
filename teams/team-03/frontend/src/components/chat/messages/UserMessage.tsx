import { ChatAvatar } from "@/components/chat/messages/ChatAvatar";
import type { Message } from "@/types/conversation";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <article className="w-full bg-[hsl(var(--chat-user))]">
      <div className="mx-auto flex max-w-3xl gap-4 px-4 py-6 md:px-6">
        <ChatAvatar role="user" />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="mb-1 text-xs font-semibold text-foreground">You</p>
          <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3">
            <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
