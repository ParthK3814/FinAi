import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { ErrorPanel, Spinner } from "../components/Feedback";
import ScoreGauge, { GRADE_COLORS } from "../components/ScoreGauge";

const STATUS_TEXT = { good: "On track", ok: "Room to improve", needs_work: "Needs work" };
const STATUS_COLOR = { good: "#23845A", ok: "#B97A0C", needs_work: "#BF4036" };

export default function ScoreDetails() {
  const { data, error, reload } = useAsync(() => api.getDashboard(3), []);

  if (error && !data) return <ErrorPanel error={error} onRetry={reload} />;
  if (!data) return <div className="grid place-items-center py-24"><Spinner /></div>;

  const { score, period } = data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">How the score works</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-500">
          Five rules, each worth a fixed number of points. Every rule is a straight line between zero points and full points,
          so you can check the maths yourself. No AI model and no live market data are involved.
        </p>
      </header>

      <section className="panel grid items-center gap-6 p-6 sm:grid-cols-[220px_1fr] lg:p-8">
        <ScoreGauge score={score.score} grade={score.grade} />
        <div>
          <h2 className="text-xl font-bold">{score.score} out of 100 - {score.grade}</h2>
          <p className="mt-1 text-sm text-ink-700">{score.summary}</p>
          <p className="mt-3 text-sm text-ink-500">Calculated from: {period.label.toLowerCase()}. The current month is left out because it is not finished.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {score.grade_bands.map((b) => (
              <li key={b.grade} className="rounded-full border border-line px-3 py-1 text-xs font-semibold">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: GRADE_COLORS[b.grade] }} />
                {b.grade}: {b.min === 0 ? "below 40" : `${b.min}+`}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Scoring rules">
        {score.components.map((c) => (
          <article key={c.key} className="panel p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold">{c.label}</h2>
              <p className="font-display text-2xl font-bold">
                {c.points.toFixed(1)}<span className="text-base font-semibold text-ink-500"> / {c.max_points}</span>
              </p>
            </div>
            <p className="mt-1 text-sm font-semibold" style={{ color: STATUS_COLOR[c.status] }}>
              {STATUS_TEXT[c.status]} - {c.value_display}
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold">Goal</dt>
                <dd className="text-ink-700">{c.target}</dd>
              </div>
              <div>
                <dt className="font-semibold">Formula</dt>
                <dd className="text-ink-700">{c.rule}</dd>
              </div>
              <div>
                <dt className="font-semibold">Your result</dt>
                <dd className="text-ink-700">{c.explanation}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <p className="rounded-xl border border-line bg-white p-4 text-sm text-ink-500">
        This score is an educational tool built on simple rules of thumb. It is not financial advice, and it cannot see
        things like your goals, taxes or local costs.
      </p>
    </div>
  );
}
