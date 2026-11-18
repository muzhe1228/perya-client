import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import pxToViewport from "postcss-px-to-viewport-8-plugin";
import { DESIGN_WIDTH } from "./src/config/config";

export default defineConfig(({ mode, command }) => {
  const dropConsole = command !== "serve";
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_BASE_URL || "http://localhost:8080";

  return {
    plugins: [react()],
    esbuild: { drop: dropConsole ? ["console", "debugger"] : [] },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "@assets": resolve(__dirname, "src/assets"),
        "@utils": resolve(__dirname, "src/utils"),
        "@components": resolve(__dirname, "src/components"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [resolve(__dirname, "src/styles")],
          api: "modern-compiler",
        },
      },
      postcss: {
        plugins: [
          pxToViewport({
            unitToConvert: "px",
            viewportWidth: DESIGN_WIDTH * 10,
            unitPrecision: 5,
            propList: ["*"],
            viewportUnit: "rem",
            fontViewportUnit: "rem",
            selectorBlackList: [".ignore-rem"],
            minPixelValue: 1,
            mediaQuery: true,
            replace: true,
          }),
        ],
      },
    },
    server: {
      port: 3010,
      host: true,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true, secure: false },
      },
    },
    build: {
      target: "es2020",
      rollupOptions: {
        output: {
          manualChunks: { "react-vendor": ["react", "react-dom", "react-router-dom"] },
        },
      },
    },
  };
});
