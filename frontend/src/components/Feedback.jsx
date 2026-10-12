import { IconAlert } from "./Icons";

export function Spinner({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center gap-3 text-ink-500" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-harbor" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function ErrorPanel({ error, onRetry }) {
  return (
    <div className="panel border-loss/30 p-6" role="alert">
      <div className="flex items-start gap-3">
        <IconAlert className="mt-0.5 shrink-0 text-loss" />
        <div>
          <h2 className="text-lg font-bold text-ink">Something went wrong</h2>
          <p className="mt-1 text-sm text-ink-700">{error?.message || "Unexpected error."}</p>
          {onRetry && (
            <button className="btn-primary mt-4" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="px-6 py-12 text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function InlineError({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-lg bg-loss-tint px-3 py-2 text-sm text-loss" role="alert">
      {children}
    </p>
  );
}
