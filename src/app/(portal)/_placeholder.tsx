// Phase-1 placeholder used by routes that come online in later phases.
export function PhasePlaceholder({
  title,
  phase,
}: {
  title: string;
  phase: 2 | 3 | 4 | 5 | 6 | 7 | 8;
}) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="brand-underline w-12" />
      <p className="text-sm text-muted-foreground">Implemented in Phase {phase}.</p>
    </div>
  );
}
