// A thin wrapper around fetch. Every backend call in the app goes through here.
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// FastAPI validation errors arrive as an array of { loc, msg } objects.
function readableError(body, status) {
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = item.loc?.slice(1).join(" ") || "";
        const message = String(item.msg || "").replace(/^Value error, /, "");
        return field ? `${field}: ${message}` : message;
      })
      .join(". ");
  }
  return `Request failed (${status}).`;
}

async function request(path, { method = "GET", body, params } = {}) {
  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
      ).toString()
    : "";

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${query}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${BASE_URL}. Is the backend running? (uvicorn app.main:app --reload)`,
      0
    );
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(readableError(data, response.status), response.status);
  return data;
}

export const api = {
  getMeta: () => request("/meta"),
  getDashboard: (months) => request("/dashboard", { params: { months } }),
  getPortfolio: () => request("/portfolio"),

  listTransactions: (filters) => request("/transactions", { params: filters }),
  createTransaction: (payload) => request("/transactions", { method: "POST", body: payload }),
  updateTransaction: (id, payload) => request(`/transactions/${id}`, { method: "PUT", body: payload }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: "DELETE" }),

  createInvestment: (payload) => request("/investments", { method: "POST", body: payload }),
  updateInvestment: (id, payload) => request(`/investments/${id}`, { method: "PUT", body: payload }),
  deleteInvestment: (id) => request(`/investments/${id}`, { method: "DELETE" }),

  resetDemo: () => request("/demo/reset", { method: "POST" }),
};
