import path from "path";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

import metadata from "./public/oauth/client-metadata.json" with { type: "json" };

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    preact(),
    {
      enforce: "pre",
      name: "oauth-config",
      config(_conf, { command }) {
        if (command === "build") {
          process.env.VITE_OAUTH_CLIENT_ID = metadata.client_id as string;
          process.env.VITE_OAUTH_REDIRECT_URI = (
            metadata.redirect_uris as string[]
          )[0];
        } else {
          const SERVER_HOST = "127.0.0.1";
          const SERVER_PORT = 5173;

          const redirectUri = (() => {
            const url = new URL((metadata.redirect_uris as string[])[0]);
            return `http://${SERVER_HOST}:${SERVER_PORT}${url.pathname}`;
          })();

          const clientId =
            `http://localhost` +
            `?redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=${encodeURIComponent(metadata.scope as string)}`;

          process.env.VITE_DEV_SERVER_PORT = "" + SERVER_PORT;
          process.env.VITE_OAUTH_CLIENT_ID = clientId;
          process.env.VITE_OAUTH_REDIRECT_URI = redirectUri;
        }

        process.env.VITE_CLIENT_URI = metadata.client_uri as string;
        process.env.VITE_OAUTH_SCOPE = metadata.scope as string;
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    open: true,
  },
});
