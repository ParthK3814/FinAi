import { useMemo, useState } from "react";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { useMeta } from "../context/MetaContext";
import { formatDate, formatMoney } from "../lib/format";
import { EmptyState, ErrorPanel, Spinner } from "../components/Feedback";
import { IconEdit, IconPlus, IconTrash } from "../components/Icons";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";

export default function Transactions() {
  const meta = useMeta();
  const [filters, setFilters] = useState({ type: "", category: "", month: "" });
  const [editing, setEditing] = useState(null); // null | "new" | transaction
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [actionError, setActionError] = useState("");

  const { data, loading, error, reload } = useAsync(() => api.listTransactions(filters), [filters]);

  const allCategories = useMemo(
    () => [...meta.income_categories, ...meta.expense_categories.filter((c) => !meta.income_categories.includes(c))],
    [meta]
  );
  const setFilter = (field) => (event) => setFilters((f) => ({ ...f, [field]: event.target.value }));

  const totals = useMemo(() => {
    const rows = data || [];
    const income = rows.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = rows.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [data]);

  function close() {
    setEditing(null);
    setServerError("");
  }

  async function save(payload) {
    setSaving(true);
    setServerError("");
    try {
      if (editing === "new") await api.createTransaction(payload);
      else await api.updateTransaction(editing.id, payload);
      close();
      reload();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(transaction) {
    const label = transaction.description || transaction.category;
    if (!window.confirm(`Delete "${label}" (${formatMoney(transaction.amount, { decimals: 2 })})?`)) return;
    setActionError("");
    try {
      await api.deleteTransaction(transaction.id);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-ink-500">Every income and expense record. Changes update your score straight away.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing("new")}><IconPlus /> Add transaction</button>
      </header>

      <section className="panel grid gap-4 p-4 sm:grid-cols-3" aria-label="Filters">
        <div>
          <label className="label" htmlFor="f-type">Type</label>
          <select id="f-type" className="field" value={filters.type} onChange={setFilter("type")}>
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-cat">Category</label>
          <select id="f-cat" className="field" value={filters.category} onChange={setFilter("category")}>
            <option value="">All categories</option>
            {allCategories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-month">Month</label>
          <input id="f-month" className="field" type="month" value={filters.month} onChange={setFilter("month")} />
        </div>
      </section>

      {actionError && <p className="rounded-lg bg-loss-tint px-3 py-2 text-sm text-loss" role="alert">{actionError}</p>}
      {error && <ErrorPanel error={error} onRetry={reload} />}

      <section className="panel overflow-hidden">
        {!data ? (
          <div className="grid place-items-center py-16"><Spinner /></div>
        ) : data.length === 0 ? (
          <EmptyState
            title="No transactions found"
            action={<button className="btn-primary" onClick={() => setEditing("new")}><IconPlus /> Add transaction</button>}
          >
            {filters.type || filters.category || filters.month ? "Try clearing a filter." : "Add your first income or expense to get started."}
          </EmptyState>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-8 gap-y-1 border-b border-line bg-mist/60 px-4 py-3 text-sm">
              <span><span className="text-ink-500">Shown:</span> <strong>{data.length}</strong>{loading && "..."}</span>
              <span><span className="text-ink-500">Income:</span> <strong className="text-gain">{formatMoney(totals.income, { decimals: 2 })}</strong></span>
              <span><span className="text-ink-500">Expenses:</span> <strong className="text-loss">{formatMoney(totals.expenses, { decimals: 2 })}</strong></span>
              <span><span className="text-ink-500">Net:</span> <strong>{formatMoney(totals.net, { decimals: 2 })}</strong></span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-line">
                  <tr>
                    <th className="th">Date</th>
                    <th className="th">Description</th>
                    <th className="th">Category</th>
                    <th className="th text-right">Amount</th>
                    <th className="th"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.map((t) => (
                    <tr key={t.id} className="hover:bg-mist/50">
                      <td className="td whitespace-nowrap text-ink-700">{formatDate(t.date)}</td>
                      <td className="td">{t.description || <span className="text-ink-300">-</span>}</td>
                      <td className="td">
                        <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-ink-700">{t.category}</span>
                      </td>
                      <td className={`td whitespace-nowrap text-right font-semibold ${t.type === "income" ? "text-gain" : "text-ink"}`}>
                        {t.type === "income" ? "+" : "-"}{formatMoney(t.amount, { decimals: 2 })}
                      </td>
                      <td className="td whitespace-nowrap text-right">
                        <button className="rounded-lg p-2 text-ink-500 hover:bg-mist hover:text-ink" onClick={() => setEditing(t)} aria-label={`Edit ${t.description || t.category}`}><IconEdit /></button>
                        <button className="rounded-lg p-2 text-ink-500 hover:bg-loss-tint hover:text-loss" onClick={() => remove(t)} aria-label={`Delete ${t.description || t.category}`}><IconTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <Modal open={editing !== null} title={editing === "new" ? "Add transaction" : "Edit transaction"} onClose={close}>
        {editing !== null && (
          <TransactionForm
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
