// One headline number. `tone` colours only the small caption, never the value.
const TONES = {
  neutral: "text-ink-500",
  good: "text-gain",
  bad: "text-loss",
  warn: "text-amber",
};

export default function StatCard({ label, value, caption, tone = "neutral", accent = "#0E7C86" }) {
  return (
    <div className="panel relative overflow-hidden p-5">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} aria-hidden="true" />
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
      {caption && <p className={`mt-1 text-sm font-medium ${TONES[tone]}`}>{caption}</p>}
    </div>
  );
}
