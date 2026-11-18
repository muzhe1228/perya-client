/** Spine WebGL 画布 DPR 上限（?quality= / ?renderTier= / ?dpr= 可覆盖） */

/** 14 Pro 前 iPhone 物理分辨率（同尺寸多代合并判旧机 DPR） */
const IPHONE_BEFORE_14_PRO_PHYSICAL: ReadonlyArray<readonly [number, number]> = [
  [750, 1334],
  [828, 1792],
  [1080, 2340],
  [1125, 2436],
  [1170, 2532],
  [1242, 2688],
  [1284, 2778],
];

const LOW_TIER_DEVICE_PIXEL_RATIO = 1.5;
const IPHONE_LEGACY_PHYSICAL_DEVICE_PIXEL_RATIO = 1.25;
const NATIVE_DEVICE_PIXEL_RATIO_MIN = 1.5;
const LOW_MEMORY_DEVICE_PIXEL_RATIO = 1;
const ANDROID_MID_MEMORY_DEVICE_PIXEL_RATIO = 1.5;
const ANDROID_HIGH_MEMORY_DEVICE_PIXEL_RATIO = 2;
const ANDROID_LOW_MEMORY_DEVICE_PIXEL_RATIO = 0.5;
const ANDROID_UNKNOWN_MEMORY_DEVICE_PIXEL_RATIO = 1.8;
const APPLE_A16_DEVICE_PIXEL_RATIO = 1.8;
const APPLE_A17_DEVICE_PIXEL_RATIO = 2;
const OLD_APPLE_GPU_MAX = 15;

const KNOWN_DEVICE_PIXEL_RATIOS = [1, 1.25, 1.5, 1.8, 2] as const;

type QualityRequested = "auto" | "low" | "high";

function isIphoneUa(ua: string): boolean {
  return /iPhone|iPod/i.test(ua);
}

function physicalScreenPx(): [number, number] {
  if (typeof window === "undefined" || typeof screen === "undefined") return [0, 0];
  const dpr = Math.round(window.devicePixelRatio || 1);
  const w = Math.round(Math.min(screen.width, screen.height) * dpr);
  const h = Math.round(Math.max(screen.width, screen.height) * dpr);
  return [w, h];
}

function matchesPhysical(
  list: ReadonlyArray<readonly [number, number]>,
  w: number,
  h: number,
): boolean {
  return list.some(([sw, sh]) => sw === w && sh === h);
}

function isIphoneBefore14Pro(ua: string): boolean {
  if (!isIphoneUa(ua)) return false;
  const [w, h] = physicalScreenPx();
  return matchesPhysical(IPHONE_BEFORE_14_PRO_PHYSICAL, w, h);
}

function quantizeDevicePixelRatio(dpr: number): number {
  const clamped = Math.min(Math.max(finiteNumber(dpr) ?? 1, 0.5), 2);
  for (const step of KNOWN_DEVICE_PIXEL_RATIOS) {
    if (Math.abs(clamped - step) < 0.025) return step;
  }
  return Math.round(clamped * 1000) / 1000;
}

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cappedNativeDpr(value: number): number {
  return Math.min(Math.max(finiteNumber(value) ?? 1, NATIVE_DEVICE_PIXEL_RATIO_MIN), 2);
}

let gpuRendererCache: string | null = null;

function readGpuRenderer(): string {
  if (gpuRendererCache !== null) return gpuRendererCache;
  gpuRendererCache = "";
  if (typeof document === "undefined") return gpuRendererCache;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    if (!gl || !("getExtension" in gl)) return gpuRendererCache;
    const webgl = gl as WebGLRenderingContext;
    const ext = webgl.getExtension("WEBGL_debug_renderer_info");
    if (ext) {
      gpuRendererCache = String(webgl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "");
    }
    webgl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    gpuRendererCache = "";
  }
  return gpuRendererCache;
}

function readDeviceMemory(): number | null {
  const value = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof value === "number" && value > 0 ? value : null;
}

function appleGpuGeneration(renderer: string | null | undefined): number | null {
  const match = /Apple A(\d+)/i.exec(renderer || "");
  if (!match) return null;
  const generation = Number(match[1]);
  return Number.isFinite(generation) ? generation : null;
}

function lowTierDpr(deviceMemory: number | null): number {
  return deviceMemory != null && deviceMemory <= 4
    ? LOW_MEMORY_DEVICE_PIXEL_RATIO
    : LOW_TIER_DEVICE_PIXEL_RATIO;
}

function androidDpr(deviceMemory: number | null): number {
  if (deviceMemory == null || deviceMemory <= 0) return ANDROID_UNKNOWN_MEMORY_DEVICE_PIXEL_RATIO;
  if (deviceMemory >= 8) return ANDROID_HIGH_MEMORY_DEVICE_PIXEL_RATIO;
  if (deviceMemory >= 4) return ANDROID_MID_MEMORY_DEVICE_PIXEL_RATIO;
  return ANDROID_LOW_MEMORY_DEVICE_PIXEL_RATIO;
}

function readQualityRequested(parameters: URLSearchParams): QualityRequested {
  const requestedValue = (parameters.get("renderTier") || parameters.get("quality") || "auto").toLowerCase();
  return requestedValue === "low" || requestedValue === "high" ? requestedValue : "auto";
}

/** 模块加载时按当前环境算一次，供 SpinePlayer 钳制 sceneRenderer DPR */
export function resolveSpineDevicePixelRatio(): number {
  if (typeof window === "undefined") return 2;

  const parameters = new URLSearchParams(window.location.search);
  const qualityRequested = readQualityRequested(parameters);
  const userAgent = navigator.userAgent || "";
  const android = /Android/i.test(userAgent);
  const iphone = /iPhone|iPod/i.test(userAgent);
  const ios = /iPhone|iPad|iPod/i.test(userAgent);
  const deviceMemory = readDeviceMemory();
  const gpuRenderer = qualityRequested === "auto" && ios && !android ? readGpuRenderer() : "";
  const appleGeneration = ios ? appleGpuGeneration(gpuRenderer) : null;
  const oldIosGpu = appleGeneration != null && appleGeneration <= OLD_APPLE_GPU_MAX;
  const tier: "low" | "high" =
    qualityRequested === "high"
      ? "high"
      : qualityRequested === "low" || (qualityRequested === "auto" && (android || oldIosGpu))
        ? "low"
        : "high";
  const nativeDpr = cappedNativeDpr(window.devicePixelRatio || 1);

  let devicePixelRatio: number;
  if (android && qualityRequested !== "high") {
    devicePixelRatio = androidDpr(deviceMemory);
  } else if (qualityRequested === "auto" && iphone) {
    devicePixelRatio = isIphoneBefore14Pro(userAgent)
      ? IPHONE_LEGACY_PHYSICAL_DEVICE_PIXEL_RATIO
      : APPLE_A17_DEVICE_PIXEL_RATIO;
  } else if (qualityRequested === "auto" && appleGeneration != null && appleGeneration > OLD_APPLE_GPU_MAX) {
    devicePixelRatio =
      appleGeneration === 16 ? APPLE_A16_DEVICE_PIXEL_RATIO : APPLE_A17_DEVICE_PIXEL_RATIO;
  } else if (tier === "low") {
    devicePixelRatio = lowTierDpr(deviceMemory);
  } else {
    devicePixelRatio = nativeDpr;
  }

  const dprValue = parameters.get("dpr");
  if (dprValue === "native") {
    devicePixelRatio = nativeDpr;
  } else if (dprValue !== null && dprValue !== "") {
    const requestedDpr = finiteNumber(dprValue);
    if (requestedDpr !== null && requestedDpr >= 0.5 && requestedDpr <= 2) {
      devicePixelRatio = requestedDpr;
    }
  }

  return quantizeDevicePixelRatio(devicePixelRatio);
}
