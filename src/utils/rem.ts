import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  PC_BOUNDARY,
  PC_HEIGHT_VH,
  SHELL_WIDTH_VH,
} from "../config/config";

document.documentElement.style.setProperty(
  "--design-width",
  DESIGN_WIDTH + "px",
);
document.documentElement.style.setProperty(
  "--design-height",
  DESIGN_HEIGHT + "px",
);
document.documentElement.style.setProperty(
  "--shell-width-vh",
  SHELL_WIDTH_VH + "vh",
);
document.documentElement.style.setProperty(
  "--pc-height-vh",
  PC_HEIGHT_VH + "vh",
);
document.documentElement.style.setProperty("--pc-boundary", PC_BOUNDARY + "px");

/** rem 基准与壳宽的共享上限（设计稿倍率）：clampRem 钳 rem 基准、--shell-max-*
 *  钳壳 CSS 尺寸，两者必须同步（rem = 壳宽/10）——大屏壳到顶后 UI 恰好铺满壳，
 *  不再出现"壳继续变大、UI 冻结留空"。数值取 3 = 素材 3x 导出的清晰度上限 */
export const REM_MAX_SCALE = 3;

document.documentElement.style.setProperty(
  // 真实 px 字符串由 JS 注入：写在 scss 里会被 PostCSS 转成 rem（随基准缩放，
  // 与"上限"语义循环），JS 注入的 px 是绝对值
  "--shell-max-width",
  DESIGN_WIDTH * REM_MAX_SCALE + "px",
);
document.documentElement.style.setProperty(
  "--shell-max-height",
  (DESIGN_WIDTH * REM_MAX_SCALE * (DESIGN_HEIGHT / DESIGN_WIDTH)).toFixed(0) + "px",
);

const baseSize = DESIGN_WIDTH / 10; // 对应 postcss rootValue

function clampRem(value: number) {
  // 上限 = 设计稿 3 倍（壳宽 1296 逻辑 px）：素材按 3x 导出，3 倍内位图 1:1 清晰；
  // 壳恒 9:16 等比缩放无布局风险，仅大屏（逻辑壳宽 > 864）会从此前的 2 倍上限
  // 放大到 3 倍。再往上（4K 全屏 ~3.1x）轻糊可接受，保留钳制防异常超宽视口无限放大
  const max = baseSize * REM_MAX_SCALE;
  return Math.min(value, max);
}

let shellEl: HTMLElement | null = null;

/** 与 main-screen 一致的内容排版宽（扣壳上 safe-area 水平 padding） */
function measureShellLayoutWidth(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const padX =
    (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  const inner = el.clientWidth - padX;
  return inner > 0 ? inner : el.clientWidth;
}

/** 移动端满屏壳：rem 按视口内容宽（与 9:16 高度上限无关） */
function mobileShellWidthFallback(clientWidth: number): number {
  return clientWidth;
}

function calculateRem(): number {
  // 壳实测优先（单一真源）：CSS 的 min(100%/dvh×aspect/max) 公式已算出壳真实
  // 宽度，JS 直接量它再除 10——rem 与壳数学上不可能脱节。此前 JS 自算
  // clientWidth/Height 与 CSS 的 dvh/媒体查询断点存在漂移空间，特定视口下
  // rem 与壳宽脱节（UI 按大壳渲染、实际壳更窄 → 内容溢出样式混乱）。
  // clientWidth 不含 border（desktop 壳是 content-box + 3px 边框），与
  // 原公式的内容宽口径一致
  if (!shellEl || !shellEl.isConnected) {
    shellEl = document.querySelector<HTMLElement>(".phone-container");
  }
  if (shellEl) {
    const shellWidth = measureShellLayoutWidth(shellEl);
    if (shellWidth > 0) return clampRem(shellWidth / 10);
  }

  const clientWidth = document.documentElement.clientWidth;
  const clientHeight = document.documentElement.clientHeight;

  let rem: number;

  if (clientWidth > PC_BOUNDARY) {
    // PC 端：高度优先，保持设计稿 432/768（9:16）比例（壳未挂载时的公式退路）
    const shellHeight = clientHeight * (PC_HEIGHT_VH / 100);
    const shellWidthFallback = shellHeight * (DESIGN_WIDTH / DESIGN_HEIGHT);
    rem = shellWidthFallback / 10;
  } else {
    rem = mobileShellWidthFallback(clientWidth) / 10;
  }

  return clampRem(rem);
}

let lastRem = -1; // 初始化为 -1，保证首次 applyRem 必定写入 DOM

// 订阅机制：React 组件可通过 useSyncExternalStore 追踪 rem 变化
const listeners = new Set<() => void>();

export function subscribeRem(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRemBase(): number {
  return lastRem;
}

function applyRem() {
  // 键盘弹出期间跳过重算（iOS WKWebView resize 会导致 rem 跳变）
  if ((window as Window & { __isKeyboardOpen?: boolean }).__isKeyboardOpen) {
    if (import.meta.env.DEV) {
      console.log("[rem] 键盘弹出期间跳过重算");
    }
    return;
  }

  const rem = calculateRem();

  if (rem !== lastRem) {
    lastRem = rem;
    document.documentElement.style.fontSize = `${rem}px`;
    document.documentElement.style.setProperty("--base-rem", `${rem}px`);
    const layoutW = rem * 10;
    document.documentElement.style.setProperty(
      "--shell-layout-width",
      `${layoutW}px`,
    );
    document.documentElement.style.setProperty(
      "--rem-scale-ratio",
      String(layoutW / DESIGN_WIDTH),
    );
    listeners.forEach((fn) => fn());
    if (import.meta.env.DEV) {
      console.log("[rem] updated", rem);
    }
    // 壳宽过渡尾巴补偿：desktop 壳 width 有 0.3s transition，此刻量到的可能是
    // 过渡中间值——结束后再量一次收敛到终值（rem 未变则 no-op）
    window.setTimeout(applyRem, 400);
  }
}

function debounce(fn: () => void, wait = 100) {
  let timeout: number | undefined;
  return () => {
    clearTimeout(timeout as number | undefined);
    timeout = window.setTimeout(fn, wait);
  };
}

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  applyRem();
} else {
  document.addEventListener("DOMContentLoaded", applyRem);
}
window.addEventListener("resize", debounce(applyRem));
window.addEventListener("orientationchange", debounce(applyRem));
// iOS 地址栏收展只发 visualViewport 的 resize（不触发 window resize），dvh 壳
// 宽随之变化——同口径重算
window.visualViewport?.addEventListener("resize", debounce(applyRem));

// 优先读取 CSS 变量 --base-rem，避免 iOS WebView 中 getComputedStyle(fontSize) 被篡改
export function getBaseRem(): number {
  const cssVar = getComputedStyle(document.documentElement)
    .getPropertyValue("--base-rem")
    .trim();
  if (cssVar) {
    const num = parseFloat(cssVar);
    if (!isNaN(num) && num > 0) return num;
  }
  return (
    parseFloat(getComputedStyle(document.documentElement).fontSize) || baseSize
  );
}

/**
 * 设计稿 px → rem 字符串。与 postcss-px-to-viewport-8-plugin（vite.config.ts）
 * 同公式：rem 值 = px / viewportWidth * 100 = px / (DESIGN_WIDTH * 10) * 100，
 * 即 1rem = DESIGN_WIDTH / 10 设计稿 px。
 * inline style / JS 定位计算不经过 PostCSS，需要与 CSS 里 px→rem 同基准换算时用本方法。
 */
export function pxToRem(px: number): string {
  return `${parseFloat((px / baseSize).toFixed(5))}rem`;
}

/**
 * 设计稿 px → 运行时实际 px（数值）。
 * 设计稿 px 按 postcss 同规则折成 rem（÷baseSize），再乘当前 rem 实际像素；
 * 用于 JS 几何计算（定位偏移、间距等 inline 数值），与 CSS 里 px→rem 的缩放保持一致。
 */
export function pxToRuntimePx(px: number): number {
  return (px / baseSize) * getBaseRem();
}
