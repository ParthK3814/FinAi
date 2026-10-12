import { NavLink } from "react-router-dom";
import { api } from "../api/client";
import { IconDashboard, IconPortfolio, IconScore, IconTransactions } from "./Icons";

const NAV = [
  { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
  { to: "/transactions", label: "Transactions", icon: IconTransactions },
  { to: "/portfolio", label: "Portfolio", icon: IconPortfolio },
  { to: "/score", label: "Score details", icon: IconScore },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#2FB8C4" />
        <path d="M8 22V10h12M8 16h9" stroke="#12263A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight">FinAI</span>
    </div>
  );
}

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
  }`;

export default function Layout({ children }) {
  async function resetDemo() {
    const ok = window.confirm(
      "Replace ALL transactions and holdings with the demo data? This cannot be undone."
    );
    if (!ok) return;
    try {
      await api.resetDemo();
      window.location.reload();
    } catch (error) {
      window.alert(error.message);
    }
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-ink p-5 text-white md:sticky md:top-0 md:flex md:h-screen">
        <Brand />
        <nav className="mt-10 flex flex-col gap-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3 text-xs leading-relaxed text-white/60">
          <p>
            Demo data. Rule-based scoring only, with no AI model and no live market prices.
          </p>
          <button onClick={resetDemo} className="font-semibold text-white/80 underline-offset-2 hover:text-white hover:underline">
            Reset demo data
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="bg-ink px-4 pt-3 text-white md:hidden">
        <Brand />
        <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-3" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={(s) => `${linkClass(s)} shrink-0`}>
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
