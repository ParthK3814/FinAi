import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ASSET_COLORS, formatMoney, formatPercent } from "../lib/format";

const AXIS = { fontSize: 12, fill: "#5B7184" };
const COLORS = { income: "#0E7C86", expenses: "#E0A33B", savings: "#12263A", need: "#0E7C86", want: "#E0A33B" };

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex justify-between gap-6">
          <span style={{ color: p.color || p.fill }}>{p.name}</span>
          <span className="font-semibold">{formatMoney(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// Income vs expenses as bars, savings as a line. The current month is partial,
// so its bars are drawn lighter and its label ends with an asterisk.
export function TrendChart({ data }) {
  const rows = data.map((m) => ({ ...m, name: m.partial ? `${m.label}*` : m.label }));
  return (
    <div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#E3EAEE" vertical={false} />
            <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatMoney(v, { compact: true })} />
            <Tooltip content={<MoneyTooltip />} cursor={{ fill: "#EEF2F4" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="income" name="Income" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={26}>
              {rows.map((r) => <Cell key={r.month} fillOpacity={r.partial ? 0.45 : 1} />)}
            </Bar>
            <Bar dataKey="expenses" name="Expenses" fill={COLORS.expenses} radius={[4, 4, 0, 0]} maxBarSize={26}>
              {rows.map((r) => <Cell key={r.month} fillOpacity={r.partial ? 0.45 : 1} />)}
            </Bar>
            <Line dataKey="savings" name="Savings" type="monotone" stroke={COLORS.savings} strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-ink-500">* Current month, still in progress. It is not used in the score.</p>
    </div>
  );
}

// Average monthly spend per category. Colour encodes need vs want.
export function CategoryChart({ data, limit = 8 }) {
  const rows = data.slice(0, limit).map((c) => ({ ...c, name: c.category }));
  return (
    <div>
      <div style={{ height: Math.max(220, rows.length * 38) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={96} tick={AXIS} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "#EEF2F4" }}
              formatter={(value, _name, item) => [`${formatMoney(value)} a month (${formatPercent(item.payload.share, 0)} of spending)`, item.payload.kind === "need" ? "Need" : "Want"]}
              labelFormatter={() => ""}
            />
            <Bar dataKey="monthly_avg" radius={[0, 4, 4, 0]} barSize={18}>
              {rows.map((r) => <Cell key={r.category} fill={COLORS[r.kind]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.need }} /> Needs</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.want }} /> Wants</span>
        <span>Average per month</span>
      </div>
    </div>
  );
}

// Donut of non-cash investments by asset type, with a legend that carries the numbers.
export function AllocationChart({ allocation, labels, total }) {
  if (!allocation.length) return null;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={allocation} dataKey="value" nameKey="asset_type" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
              {allocation.map((a) => <Cell key={a.asset_type} fill={ASSET_COLORS[a.asset_type] || ASSET_COLORS.other} />)}
            </Pie>
            <Tooltip formatter={(v, _n, item) => [formatMoney(v), labels[item.payload.asset_type] || item.payload.asset_type]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-ink-500">Invested</span>
          <span className="font-display text-xl font-bold">{formatMoney(total, { compact: true })}</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {allocation.map((a) => (
          <li key={a.asset_type} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-full" style={{ background: ASSET_COLORS[a.asset_type] || ASSET_COLORS.other }} />
              {labels[a.asset_type] || a.asset_type}
            </span>
            <span className="font-semibold">{formatPercent(a.weight, 1)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
