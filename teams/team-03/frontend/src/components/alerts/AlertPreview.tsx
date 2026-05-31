export function AlertPreview({ text }: { text: string }) {
  return (
    <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-3 text-sm">
      {text}
    </pre>
  );
}
