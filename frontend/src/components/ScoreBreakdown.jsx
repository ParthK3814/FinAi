const STATUS = {
  good: { color: "#23845A", text: "On track" },
  ok: { color: "#B97A0C", text: "Room to improve" },
  needs_work: { color: "#BF4036", text: "Needs work" },
};

// One row per scoring rule: points earned, the measured value, and a filled bar.
export default function ScoreBreakdown({ components, showTarget = false }) {
  return (
    <ul className="space-y-4">
      {components.map((c) => {
        const status = STATUS[c.status];
        const percent = (c.points / c.max_points) * 100;
        return (
          <li key={c.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">{c.label}</span>
              <span className="text-sm tabular-nums">
                <strong className="font-display text-base">{c.points.toFixed(1)}</strong>
                <span className="text-ink-500"> / {c.max_points}</span>
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist"
              role="progressbar"
              aria-valuenow={c.points}
              aria-valuemin={0}
              aria-valuemax={c.max_points}
              aria-label={`${c.label} points`}
            >
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${percent}%`, background: status.color }} />
            </div>
            <p className="mt-1 text-xs text-ink-500">
              <span className="font-semibold" style={{ color: status.color }}>{status.text}</span>
              {" - "}
              {c.value_display}
            </p>
            {showTarget && <p className="mt-0.5 text-xs text-ink-500">{c.target}</p>}
          </li>
        );
      })}
    </ul>
  );
}
