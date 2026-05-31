export function TypingIndicator() {
  return (
    <div className="mx-auto flex max-w-3xl gap-4 px-4 py-4 md:px-6">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-emerald-700 text-[10px] font-bold text-white">
        PM
      </div>
      <div className="flex items-center gap-1 pt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
