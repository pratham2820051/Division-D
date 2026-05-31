export function FirstAidCard({ content }: { content: string }) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <h3 className="mb-2 font-semibold">First Aid</h3>
      <p className="text-sm">{content}</p>
    </div>
  );
}
