import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// envDir: "../" lets the frontend read VITE_* values from the single
// project-level .env file shared with the backend.
export default defineConfig({
  plugins: [react()],
  envDir: "../",
  server: { port: 5173 },
});
