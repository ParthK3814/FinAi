import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api/client";
import { useAsync } from "./hooks/useAsync";
import { setCurrency } from "./lib/format";
import { MetaContext } from "./context/MetaContext";
import Layout from "./components/Layout";
import { ErrorPanel, Spinner } from "./components/Feedback";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Portfolio from "./pages/Portfolio";
import ScoreDetails from "./pages/ScoreDetails";

export default function App() {
  const { data: meta, loading, error, reload } = useAsync(api.getMeta, []);

  useEffect(() => {
    if (meta) setCurrency(meta.currency);
  }, [meta]);

  if (error && !meta) {
    return (
      <div className="mx-auto max-w-xl p-6 pt-24">
        <ErrorPanel error={error} onRetry={reload} />
      </div>
    );
  }
  if (!meta) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label={loading ? "Connecting to the API" : ""} />
      </div>
    );
  }

  // setCurrency must run before pages render, so call it here too (idempotent).
  setCurrency(meta.currency);

  return (
    <MetaContext.Provider value={meta}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/score" element={<ScoreDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </MetaContext.Provider>
  );
}
