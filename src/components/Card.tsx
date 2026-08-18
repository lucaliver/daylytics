import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  action,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-(--color-text-secondary)">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
      {footer && (
        <div className="mt-4 border-t border-(--color-border) pt-3">{footer}</div>
      )}
    </section>
  );
}
