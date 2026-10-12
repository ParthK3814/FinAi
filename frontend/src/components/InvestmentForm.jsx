import { useState } from "react";
import { useMeta } from "../context/MetaContext";
import { todayIso } from "../lib/format";
import { InlineError } from "./Feedback";

const EMPTY = {
  name: "", symbol: "", asset_type: "stock", quantity: "", buy_price: "", current_price: "", purchase_date: "",
};

export default function InvestmentForm({ initial, onSubmit, onCancel, saving, serverError }) {
  const meta = useMeta();
  const [form, setForm] = useState(
    initial
      ? {
          ...initial,
          symbol: initial.symbol || "",
          quantity: String(initial.quantity),
          buy_price: String(initial.buy_price),
          current_price: String(initial.current_price),
          purchase_date: initial.purchase_date || "",
        }
      : EMPTY
  );
  const [error, setError] = useState("");
  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  function submit(event) {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const buy = Number(form.buy_price);
    const current = Number(form.current_price);
    if (!form.name.trim()) return setError("Enter a name.");
    if (!(quantity > 0)) return setError("Quantity must be greater than zero.");
    if (!(buy >= 0) || form.buy_price === "") return setError("Enter the price you paid (0 or more).");
    if (!(current >= 0) || form.current_price === "") return setError("Enter the current price (0 or more).");
    if (form.purchase_date && form.purchase_date > todayIso()) return setError("The purchase date cannot be in the future.");
    setError("");
    onSubmit({
      name: form.name.trim(),
      symbol: form.symbol.trim() || null,
      asset_type: form.asset_type,
      quantity,
      buy_price: buy,
      current_price: current,
      purchase_date: form.purchase_date || null,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="inv-name">Name</label>
          <input id="inv-name" className="field" maxLength={120} value={form.name} onChange={set("name")} placeholder="e.g. S&P 500 Index ETF" />
        </div>
        <div>
          <label className="label" htmlFor="inv-symbol">Symbol</label>
          <input id="inv-symbol" className="field uppercase" maxLength={20} value={form.symbol} onChange={set("symbol")} placeholder="VOO" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="inv-type">Asset type</label>
        <select id="inv-type" className="field" value={form.asset_type} onChange={set("asset_type")}>
          {meta.asset_types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {form.asset_type === "cash" && (
          <p className="mt-1 text-xs text-ink-500">
            For cash, use quantity 1 and enter the balance as both prices. Cash counts toward your emergency fund, not diversification.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="inv-qty">Quantity</label>
          <input id="inv-qty" className="field" type="number" min="0" step="any" value={form.quantity} onChange={set("quantity")} />
        </div>
        <div>
          <label className="label" htmlFor="inv-buy">Buy price</label>
          <input id="inv-buy" className="field" type="number" min="0" step="any" value={form.buy_price} onChange={set("buy_price")} />
        </div>
        <div>
          <label className="label" htmlFor="inv-cur">Current price</label>
          <input id="inv-cur" className="field" type="number" min="0" step="any" value={form.current_price} onChange={set("current_price")} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-ink-500">Prices are entered by hand. FinAI does not fetch live market data.</p>

      <div>
        <label className="label" htmlFor="inv-date">Purchase date <span className="font-normal text-ink-500">(optional)</span></label>
        <input id="inv-date" className="field" type="date" max={todayIso()} value={form.purchase_date} onChange={set("purchase_date")} />
      </div>

      <InlineError>{error || serverError}</InlineError>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-quiet" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : initial ? "Save changes" : "Add holding"}
        </button>
      </div>
    </form>
  );
}
