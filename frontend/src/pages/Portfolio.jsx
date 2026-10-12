import { useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { useMeta } from "../context/MetaContext";
import { ASSET_COLORS, formatMoney, formatPercent, formatPercentPoints } from "../lib/format";
import { EmptyState, ErrorPanel, Spinner } from "../components/Feedback";
import { IconEdit, IconPlus, IconTrash } from "../components/Icons";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import { AllocationChart } from "../components/Charts";
import InvestmentForm from "../components/InvestmentForm";

export default function Portfolio() {
  const meta = useMeta();
  const labels = Object.fromEntries(meta.asset_types.map((t) => [t.value, t.label]));
  const { data, error, reload } = useAsync(api.getPortfolio, []);
  const [editing, setEditing] = useState(null); // null | "new" | holding
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [actionError, setActionError] = useState("");

  if (error && !data) return <ErrorPanel error={error} onRetry={reload} />;
  if (!data) return <div className="grid place-items-center py-24"><Spinner /></div>;

  const { summary, holdings } = data;
  const investments = holdings.filter((h) => h.asset_type !== "cash");
  const cashHoldings = holdings.filter((h) => h.asset_type === "cash");

  function close() {
    setEditing(null);
    setServerError("");
  }

  async function save(payload) {
    setSaving(true);
    setServerError("");
    try {
      if (editing === "new") await api.createInvestment(payload);
      else await api.updateInvestment(editing.id, payload);
      close();
      reload();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(holding) {
    if (!window.confirm(`Delete "${holding.name}" from your portfolio?`)) return;
    setActionError("");
    try {
      await api.deleteInvestment(holding.id);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  function Row({ h, showWeight }) {
    return (
      <tr className="hover:bg-mist/50">
        <td className="td">
          <div className="flex items-center gap-2.5">
            <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ASSET_COLORS[h.asset_type] || ASSET_COLORS.other }} />
            <div>
              <p className="font-semibold">{h.name}</p>
              <p className="text-xs text-ink-500">{[h.symbol, labels[h.asset_type]].filter(Boolean).join(" - ")}</p>
            </div>
          </div>
        </td>
        <td className="td whitespace-nowrap text-right">{h.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
        <td className="td whitespace-nowrap text-right">{formatMoney(h.buy_price, { decimals: 2 })}</td>
        <td className="td whitespace-nowrap text-right">{formatMoney(h.current_price, { decimals: 2 })}</td>
        <td className="td whitespace-nowrap text-right font-semibold">{formatMoney(h.current_value)}</td>
        <td className={`td whitespace-nowrap text-right font-semibold ${h.gain >= 0 ? "text-gain" : "text-loss"}`}>
          {formatPercentPoints(h.gain_pct)}
        </td>
        <td className="td min-w-[110px]">
          {showWeight && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
                <div className="h-full rounded-full bg-harbor" style={{ width: `${Math.min(100, h.weight * 100)}%` }} />
              </div>
              <span className="w-11 text-right text-xs text-ink-700">{formatPercent(h.weight, 0)}</span>
            </div>
          )}
        </td>
        <td className="td whitespace-nowrap text-right">
          <button className="rounded-lg p-2 text-ink-500 hover:bg-mist hover:text-ink" onClick={() => setEditing(h)} aria-label={`Edit ${h.name}`}><IconEdit /></button>
          <button className="rounded-lg p-2 text-ink-500 hover:bg-loss-tint hover:text-loss" onClick={() => remove(h)} aria-label={`Delete ${h.name}`}><IconTrash /></button>
        </td>
      </tr>
    );
  }

  function HoldingsTable({ rows, showWeight }) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-line">
            <tr>
              <th className="th">Holding</th>
              <th className="th text-right">Quantity</th>
              <th className="th text-right">Buy price</th>
              <th className="th text-right">Current price</th>
              <th className="th text-right">Value</th>
              <th className="th text-right">Gain / loss</th>
              <th className="th">{showWeight ? "Share" : ""}</th>
              <th className="th"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((h) => <Row key={h.id} h={h} showWeight={showWeight} />)}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="mt-1 text-sm text-ink-500">Stocks, funds and other holdings. Prices are typed in by you, so update them when you want fresh numbers.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing("new")}><IconPlus /> Add holding</button>
      </header>

      {actionError && <p className="rounded-lg bg-loss-tint px-3 py-2 text-sm text-loss" role="alert">{actionError}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Portfolio summary">
        <StatCard label="Current value" value={formatMoney(summary.current_value)} accent="#3D6FB6" />
        <StatCard label="Amount invested" value={formatMoney(summary.invested_cost)} accent="#12263A" />
        <StatCard
          label="Total gain / loss"
          value={formatMoney(summary.gain)}
          caption={formatPercentPoints(summary.gain_pct)}
          tone={summary.gain >= 0 ? "good" : "bad"}
          accent={summary.gain >= 0 ? "#23845A" : "#BF4036"}
        />
        <StatCard label="Cash & savings" value={formatMoney(summary.cash_value)} caption="Counts toward your emergency fund" accent="#2FB8C4" />
      </section>

      {holdings.length === 0 ? (
        <section className="panel">
          <EmptyState
            title="No holdings yet"
            action={<button className="btn-primary" onClick={() => setEditing("new")}><IconPlus /> Add holding</button>}
          >
            Add a stock, fund or cash balance to see allocation and diversification.
          </EmptyState>
        </section>
      ) : (
        <>
          {summary.allocation.length > 0 && (
            <section className="panel p-6">
              <h2 className="mb-4 text-lg font-bold">Allocation by asset type</h2>
              <AllocationChart allocation={summary.allocation} labels={labels} total={summary.current_value} />
            </section>
          )}

          {investments.length > 0 && (
            <section className="panel overflow-hidden">
              <h2 className="px-4 pb-1 pt-5 text-lg font-bold">Investments</h2>
              <HoldingsTable rows={investments} showWeight />
            </section>
          )}

          {cashHoldings.length > 0 && (
            <section className="panel overflow-hidden">
              <h2 className="px-4 pb-1 pt-5 text-lg font-bold">Cash &amp; savings</h2>
              <HoldingsTable rows={cashHoldings} showWeight={false} />
            </section>
          )}
        </>
      )}

      <Modal open={editing !== null} title={editing === "new" ? "Add holding" : "Edit holding"} onClose={close}>
        {editing !== null && (
          <InvestmentForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? null : editing}
            onSubmit={save}
            onCancel={close}
            saving={saving}
            serverError={serverError}
          />
        )}
      </Modal>
    </div>
  );
}
