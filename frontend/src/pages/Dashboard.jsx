import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { useMeta } from "../context/MetaContext";
import { formatMoney, formatPercent, formatPercentPoints } from "../lib/format";
import { ErrorPanel, Spinner } from "../components/Feedback";
import StatCard from "../components/StatCard";
import ScoreGauge from "../components/ScoreGauge";
import ScoreBreakdown from "../components/ScoreBreakdown";
import InsightList from "../components/InsightList";
import { AllocationChart, CategoryChart, TrendChart } from "../components/Charts";

export default function Dashboard() {
  const meta = useMeta();
  const [months, setMonths] = useState(3);
  const { data, loading, error, reload } = useAsync(() => api.getDashboard(months), [months]);

  if (error && !data) return <ErrorPanel error={error} onRetry={reload} />;
  if (!data) return <div className="grid place-items-center py-24"><Spinner /></div>;

  const { summary, score, insights, portfolio, period } = data;
  const labels = Object.fromEntries(meta.asset_types.map((t) => [t.value, t.label]));
  const rate = summary.savings_rate;
  const hasData = period.months > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-ink-500">
            {period.label}. Monthly figures are averages over this period.
            {loading && " Updating..."}
          </p>
        </div>
        <div>
          <label htmlFor="months" className="mr-2 text-sm font-medium text-ink-700">Analyse</label>
          <select id="months" className="field !w-auto" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            <option value={1}>last month</option>
            <option value={3}>last 3 months</option>
            <option value={6}>last 6 months</option>
            <option value={12}>last 12 months</option>
          </select>
        </div>
      </header>

      {error && <ErrorPanel error={error} onRetry={reload} />}

      {/* Score: the one big moment on the page */}
      <section className="panel grid gap-8 p-6 lg:grid-cols-[260px_1fr] lg:p-8" aria-labelledby="score-heading">
        <div className="flex flex-col items-center justify-center">
          <h2 id="score-heading" className="mb-3 text-lg font-bold">Financial Logic Score</h2>
          <ScoreGauge score={score.score} grade={score.grade} />
          <p className="mt-3 max-w-[16rem] text-center text-sm text-ink-500">{score.summary}</p>
        </div>
        <div>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-bold">Where the points come from</h2>
            <Link to="/score" className="text-sm font-semibold text-harbor-dark hover:underline">How it is calculated</Link>
          </div>
          <ScoreBreakdown components={score.components} />
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
        <StatCard label="Income per month" value={formatMoney(summary.avg_monthly_income)} accent="#0E7C86" />
        <StatCard label="Expenses per month" value={formatMoney(summary.avg_monthly_expenses)} accent="#E0A33B" />
        <StatCard
          label="Savings per month"
          value={formatMoney(summary.avg_monthly_savings)}
          caption={rate === null ? "No income recorded" : `${formatPercent(rate)} of income`}
          tone={rate === null ? "neutral" : rate >= 0.2 ? "good" : rate >= 0.1 ? "warn" : "bad"}
          accent="#12263A"
        />
        <StatCard
          label="Investments"
          value={formatMoney(summary.investment_value)}
          caption={`${formatPercentPoints(summary.investment_gain_pct)} on cost, plus ${formatMoney(summary.cash_value)} cash`}
          tone={summary.investment_gain >= 0 ? "good" : "bad"}
          accent="#3D6FB6"
        />
      </section>

      {hasData ? (
        <>
          <section className="grid gap-6 lg:grid-cols-5">
            <div className="panel p-6 lg:col-span-3">
              <h2 className="mb-4 text-lg font-bold">Income, expenses and savings</h2>
              <TrendChart data={data.monthly_trend} />
            </div>
            <div className="panel p-6 lg:col-span-2">
              <h2 className="mb-4 text-lg font-bold">Where the money goes</h2>
              <CategoryChart data={data.expense_by_category} />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-5">
            <div className="panel p-6 lg:col-span-2">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-bold">Portfolio allocation</h2>
                <Link to="/portfolio" className="text-sm font-semibold text-harbor-dark hover:underline">Open portfolio</Link>
              </div>
              {portfolio.allocation.length ? (
                <AllocationChart allocation={portfolio.allocation} labels={labels} total={portfolio.current_value} />
              ) : (
                <p className="text-sm text-ink-500">No investments yet. Add holdings on the Portfolio page.</p>
              )}
            </div>
            <div className="lg:col-span-3">
              <h2 className="mb-4 text-lg font-bold">Insights</h2>
              <InsightList insights={insights} />
            </div>
          </section>
        </>
      ) : (
        <div className="panel p-8 text-center">
          <h2 className="text-lg font-bold">No data to analyse yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
            Add income and expense records on the Transactions page, or reset to demo data from the sidebar.
          </p>
          <Link to="/transactions" className="btn-primary mt-4">Add transactions</Link>
        </div>
      )}
    </div>
  );
}
