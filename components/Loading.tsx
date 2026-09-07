export function Loading({ label = "불러오는 중" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="animate-bounce text-4xl">💗</div>
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}
