const SEVERITY = {
  critical: { color: "#BF4036", tint: "#FBE7E4", text: "Urgent" },
  warning: { color: "#B97A0C", tint: "#FBF0D9", text: "Watch" },
  info: { color: "#3D6FB6", tint: "#E6EEF8", text: "Note" },
  positive: { color: "#23845A", tint: "#E1F3EA", text: "On track" },
};

export default function InsightList({ insights, limit }) {
  const items = limit ? insights.slice(0, limit) : insights;
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const style = SEVERITY[item.severity] || SEVERITY.info;
        return (
          <li key={item.id} className="rounded-xl border border-line bg-white p-4" style={{ borderLeft: `4px solid ${style.color}` }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: style.tint, color: style.color }}>
                {style.text}
              </span>
              <h3 className="font-sans text-sm font-bold">{item.title}</h3>
            </div>
            <p className="mt-1.5 text-sm text-ink-700">{item.detail}</p>
            {item.action && <p className="mt-1.5 text-sm font-semibold text-harbor-dark">Next step: {item.action}</p>}
          </li>
        );
      })}
    </ul>
  );
}
