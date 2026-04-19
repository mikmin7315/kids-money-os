export function ChildSectionHeader({
  title,
  badge,
}: {
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">
        {title}
      </p>
      {badge}
    </div>
  );
}
