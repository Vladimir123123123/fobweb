import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

const envDir = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  envDir,
  server: { port: 4321 },
  vite: {
    envDir,
    server: {
      proxy: {
        "/api": "http://127.0.0.1:3000",
        "/auth": "http://127.0.0.1:3000",
      },
    },
  },
});
