export function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="w-full">
      <div className="mb-1 text-sm">Confidence: {Math.round(value * 100)}%</div>
      <div className="h-2 w-full rounded bg-gray-200">
        <div
          className="h-2 rounded bg-green-600"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}
