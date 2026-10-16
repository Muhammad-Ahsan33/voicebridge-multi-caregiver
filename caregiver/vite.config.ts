import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Runs on a different port than frontend/ (5173) so both apps can run
// side by side during development.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
});
