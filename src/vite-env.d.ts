/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_TRACKING: string;
  readonly VITE_ARMS_PID: string;
  readonly VITE_ARMS_ENDPOINT: string;
  readonly VITE_LOBBY_JP_POLL_MS?: string;
  readonly VITE_LOBBY_JP_MOCK?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.scss" {
  const css: string;
  export default css;
}