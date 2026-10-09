import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),

    {
      name: "show-dev-page",

      configureServer(server) {
        server.httpServer?.once("listening", () => {
          const address = server.httpServer?.address();

          if (address && typeof address === "object") {
            server.config.logger.info(
                `  ➜  Dev:     http://localhost:${address.port}/dev`
            );
          }
        });
      },
    },
  ],

  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});