import type { ReactNode } from "react";

/** Fades and slides a section in on mount, staggered by index. Purely a
 * presentation wrapper — no state, no measuring, so it's safe around any
 * child including ones with their own internal animation (e.g. charts). */
export function Reveal({ index = 0, children }: { index?: number; children: ReactNode }) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 70}ms` }}>
      {children}
    </div>
  );
}
