import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  // A self-signed cert so the dev server (incl. over `--host` on the LAN)
  // is a secure context — the Web Share API used by the "Share" button
  // (YearInReview.tsx) is unavailable over plain HTTP on anything but
  // localhost, which a phone hitting the LAN IP never counts as.
  plugins: [react(), tailwindcss(), basicSsl()],
});
