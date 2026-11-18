import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import { useUserStore } from "@/stores/useUserStore";

/**
 * 单例 baseURL（与 masskara-client 同口径）：
 * - dev：空串 → 同源 `/api/*` 走 Vite 代理（target = `.env` 的 VITE_API_BASE_URL）
 * - prod：VITE_API_BASE_URL 直连；未配置则为空（与前端同域，由网关反代）
 */
export const API_PREFIX = import.meta.env.PROD
  ? (import.meta.env.VITE_API_BASE_URL ?? "")
  : "";

/** 统一信封：成功 `code` 为 0 或 200（与 masskara 后端一致）；暂不按 bizCode 分支 */
interface ApiEnvelope<T> {
  code?: number | string;
  data?: T;
  msg?: string;
  requestId?: string;
  traceId?: string;
}

interface ApiErrorBody {
  code?: number | string;
  msg?: string;
  requestId?: string;
  traceId?: string;
}

export class ApiError extends Error {
  readonly httpStatus: number;
  readonly code: number | string;
  readonly requestId?: string;
  readonly traceId?: string;

  constructor(
    httpStatus: number,
    code: number | string,
    message: string,
    requestId?: string,
    traceId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.httpStatus = httpStatus;
    this.code = code;
    this.requestId = requestId;
    this.traceId = traceId;
  }
}

const RETRYABLE_STATUS = new Set([429]);
const MAX_RETRY = 1;
const UNAUTHORIZED_DEDUP_MS = 1000;

type PeryaRequestConfig = AxiosRequestConfig & {
  _peryaSilent?: boolean;
  _mkRetry?: number;
};

let lastUnauthorizedAt = 0;

function handleUnauthorized() {
  const now = Date.now();
  if (now - lastUnauthorizedAt < UNAUTHORIZED_DEDUP_MS) return;
  lastUnauthorizedAt = now;
  useUserStore.getState().logout();
}

function toApiError(error: AxiosError<ApiErrorBody>): ApiError {
  const status = error.response?.status ?? -1;
  const body = error.response?.data;
  if (body && (body.msg != null || body.code != null)) {
    return new ApiError(
      status,
      body.code ?? status,
      body.msg ?? "Request failed",
      body.requestId,
      body.traceId,
    );
  }
  if (error.code === "ECONNABORTED") {
    return new ApiError(-1, -1, "Request timed out, please try again");
  }
  return new ApiError(status, status, `Request failed (${status})`);
}

export function createHttp(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
  });

  instance.interceptors.request.use((config) => {
    const token = useUserStore.getState().userInfo.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorBody>) => {
      const { response, config } = error;

      if (response?.status === 401) {
        handleUnauthorized();
        throw toApiError(error);
      }

      if (response?.status && RETRYABLE_STATUS.has(response.status) && config) {
        const retry = config as PeryaRequestConfig;
        retry._mkRetry = (retry._mkRetry ?? 0) + 1;
        if (retry._mkRetry <= MAX_RETRY) {
          const retryAfterSec = Number(response.headers["retry-after"] ?? 1) || 1;
          await new Promise((r) => setTimeout(r, retryAfterSec * 1000));
          return instance(config);
        }
      }

      throw toApiError(error);
    },
  );

  return instance;
}

async function request<T>(instance: AxiosInstance, config: AxiosRequestConfig): Promise<T> {
  const res = await instance.request<ApiEnvelope<T> | T>(config);
  const data = res.data;

  if (typeof data === "object" && data !== null && "code" in data) {
    const env = data as ApiEnvelope<T>;
    const code = env.code;
    const ok = code === 0 || code === 200;
    if (ok) return env.data as T;
    throw new ApiError(
      res.status,
      code ?? -1,
      env.msg ?? "Request failed",
      env.requestId,
      env.traceId,
    );
  }

  if (config.responseType === "blob" || config.responseType === "arraybuffer") {
    return res.data as T;
  }
  return data as T;
}

export const bindGet =
  (instance: AxiosInstance) =>
  <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>(instance, { ...config, url, method: "GET" });

export const bindPost =
  (instance: AxiosInstance) =>
  <T>(url: string, data?: object, config?: AxiosRequestConfig) =>
    request<T>(instance, { ...config, url, method: "POST", data });

export const bindPut =
  (instance: AxiosInstance) =>
  <T>(url: string, data?: object, config?: AxiosRequestConfig) =>
    request<T>(instance, { ...config, url, method: "PUT", data });

export const bindDelete =
  (instance: AxiosInstance) =>
  <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>(instance, { ...config, url, method: "DELETE" });

/** 全局单例（token 注入 + 信封解包 + 401 清态 + 429 一次重试） */
export const http = createHttp(API_PREFIX);

export const getReq = bindGet(http);
export const postReq = bindPost(http);
export const putReq = bindPut(http);
export const deleteReq = bindDelete(http);
