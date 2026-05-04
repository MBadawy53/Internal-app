import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  withTagline?: boolean;
}

/**
 * Wordmark fallback used until the brand SVG is dropped into /public/brand/logo.svg.
 * Replicates the logo's blue wordmark + orange/yellow underline accent.
 */
export function Logo({ className, withTagline = false }: LogoProps) {
  return (
    <div className={cn("inline-flex select-none flex-col gap-1", className)}>
      <span className="text-2xl font-extrabold italic tracking-tight text-brand-600">Contact</span>
      <span className="brand-underline w-20" />
      {withTagline ? (
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Financial Holding
        </span>
      ) : null}
    </div>
  );
}
