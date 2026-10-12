import { useState } from "react";
import { useMeta } from "../context/MetaContext";
import { todayIso } from "../lib/format";
import { InlineError } from "./Feedback";

export default function TransactionForm({ initial, onSubmit, onCancel, saving, serverError }) {
  const meta = useMeta();
  const [form, setForm] = useState(
    initial
      ? { ...initial, amount: String(initial.amount) }
      : { type: "expense", category: "Groceries", description: "", amount: "", date: todayIso() }
  );
  const [error, setError] = useState("");

  const categories = form.type === "income" ? meta.income_categories : meta.expense_categories;
  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  function changeType(type) {
    const list = type === "income" ? meta.income_categories : meta.expense_categories;
    setForm((f) => ({ ...f, type, category: list.includes(f.category) ? f.category : list[0] }));
  }

  function submit(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.category) return setError("Choose a category.");
    if (!(amount > 0)) return setError("Enter an amount greater than zero.");
    if (!form.date) return setError("Choose a date.");
    if (form.date > todayIso()) return setError("The date cannot be in the future.");
    setError("");
    onSubmit({ type: form.type, category: form.category, description: form.description.trim(), amount, date: form.date });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div role="group" aria-label="Type" className="grid grid-cols-2 gap-1 rounded-lg bg-mist p-1">
        {["expense", "income"].map((type) => (
          <button
            type="button"
            key={type}
            onClick={() => changeType(type)}
            aria-pressed={form.type === type}
            className={`rounded-md py-1.5 text-sm font-semibold capitalize transition-colors ${form.type === type ? "bg-white text-ink" : "text-ink-500 hover:text-ink"}`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="tx-amount">Amount</label>
          <input id="tx-amount" className="field" type="number" min="0" step="0.01" inputMode="decimal" value={form.amount} onChange={set("amount")} placeholder="0.00" />
        </div>
        <div>
          <label className="label" htmlFor="tx-date">Date</label>
          <input id="tx-date" className="field" type="date" max={todayIso()} value={form.date} onChange={set("date")} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="tx-category">Category</label>
        <select id="tx-category" className="field" value={form.category} onChange={set("category")}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="tx-desc">Description <span className="font-normal text-ink-500">(optional)</span></label>
        <input id="tx-desc" className="field" maxLength={200} value={form.description} onChange={set("description")} placeholder="e.g. Weekly groceries" />
      </div>

      <InlineError>{error || serverError}</InlineError>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-quiet" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : initial ? "Save changes" : "Add transaction"}
        </button>
      </div>
    </form>
  );
}
