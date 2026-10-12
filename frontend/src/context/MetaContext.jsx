import { createContext, useContext } from "react";

// Categories, asset types and currency loaded once from GET /api/meta.
export const MetaContext = createContext(null);
export const useMeta = () => useContext(MetaContext);
