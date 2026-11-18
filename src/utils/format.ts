/**
 * 数字格式化工具：千分位（en-US 口径，与 masskara-client 一致）。
 * 服务端金额一律字符串（需求 §8.5）：调用时直接透传，内部 Number() 转换；
 * 非法/空值按 0 兜底，避免 NaN 上屏。
 *
 * 接口/计算可带四位（如 1.2345），上屏前 quantMoney 四舍五入到三位并去尾零
 * （8.9705 → 8.971，900.000 → 900）。服务端字符串请原样传入 fmt/quant，勿先 Number() 再格式化。
 */

/** 接口常见精度（文档/ mock 字符串位数，展示仍以 MONEY_MAX_DECIMALS 为准） */
export const MONEY_SOURCE_DECIMALS = 4;

/** 展示层最大小数位（四舍五入后 fmtMoney/fmtPeso 等统一口径） */
export const MONEY_MAX_DECIMALS = 3;

const MONEY_DECIMAL_RE = /^(-?)(\d+)(?:\.(\d*))?$/;

/** 按十进制字符串四舍五入（避免 8.9705→Number 变成 8.970499… 导致第三位不进位） */
function quantMoneyFromDecimalString(raw: string): number {
  const s = raw.trim();
  if (!s) return 0;
  const m = s.match(MONEY_DECIMAL_RE);
  if (!m) {
    const n = Number(s);
    return Number.isFinite(n)
      ? quantMoneyFromDecimalString(n.toFixed(MONEY_SOURCE_DECIMALS))
      : 0;
  }
  const neg = m[1] === "-";
  const intDigits = m[2].replace(/^0+(?=\d)/, "") || "0";
  const fracPadded = (m[3] ?? "").slice(0, MONEY_SOURCE_DECIMALS).padEnd(MONEY_SOURCE_DECIMALS, "0");
  const sourceScale = 10 ** MONEY_SOURCE_DECIMALS;
  const displayScale = 10 ** MONEY_MAX_DECIMALS;
  const step = sourceScale / displayScale;

  const sourceUnits = BigInt(intDigits) * BigInt(sourceScale) + BigInt(fracPadded || "0");
  const rounded = (sourceUnits + BigInt(step / 2)) / BigInt(step);
  const intOut = rounded / BigInt(displayScale);
  const fracOut = rounded % BigInt(displayScale);
  const magnitude = Number(intOut) + Number(fracOut) / displayScale;
  return neg ? -magnitude : magnitude;
}

/** 四舍五入到展示位并去尾零（优先走字符串；number 先 toFixed(源精度) 再舍入） */
export const quantMoney = (v: string | number | null | undefined): number => {
  if (v == null || v === "") return 0;
  if (typeof v === "string") return quantMoneyFromDecimalString(v);
  if (!Number.isFinite(v)) return 0;
  return quantMoneyFromDecimalString(v.toFixed(MONEY_SOURCE_DECIMALS));
};

/**
 * 安全千分位：包裹 toLocaleString，对 locale 异常或运行时格式异常做兜底，
 * 避免 RangeError 使页面崩溃。
 */
const safeLocale = (
  v: number,
  options: Intl.NumberFormatOptions,
  fallback: string,
): string => {
  try {
    return v.toLocaleString("en-US", options);
  } catch {
    try {
      return v.toLocaleString(undefined, options);
    } catch {
      return fallback;
    }
  }
};

const moneyLocaleOpts: Intl.NumberFormatOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: MONEY_MAX_DECIMALS,
};

/** 千分位 + 金额口径（最多三位小数四舍五入，自动去尾零） */
export const fmtMoney = (v: string | number | null | undefined): string => {
  if (v == null || v === "") return "0";
  const q = quantMoney(v);
  if (!Number.isFinite(q)) return "0";
  return safeLocale(q, moneyLocaleOpts, String(q));
};

/** 纯数字（无千分位）+ 最多三位小数 + 去尾零（Unity OnPlayMove.score 等） */
export const fmtPlain = (v: string | number | null | undefined): string =>
  String(quantMoney(v));

/** 接口/mock：保留源精度四位字符串（与 MONEY_SOURCE_DECIMALS 一致，非展示层） */
export const toApiMoney = (v: string | number | null | undefined): string => {
  if (v == null || v === "") return (0).toFixed(MONEY_SOURCE_DECIMALS);
  if (typeof v === "string") {
    const m = v.trim().match(MONEY_DECIMAL_RE);
    if (m) {
      const frac = (m[3] ?? "").padEnd(MONEY_SOURCE_DECIMALS, "0").slice(0, MONEY_SOURCE_DECIMALS);
      return `${m[1]}${m[2]}.${frac}`;
    }
  }
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(MONEY_SOURCE_DECIMALS) : (0).toFixed(MONEY_SOURCE_DECIMALS);
};

/** 千分位 + 货币符号 */
export const fmtPeso = (v: string | number | null | undefined): string =>
  `₱${fmtMoney(v)}`;

/** 空值 / 非法 → "₱--"（历史稿面占位）；有值同 fmtPeso */
export const fmtPesoOrDash = (v: string | number | null | undefined): string => {
  if (v == null || v === "") return "₱--";
  const n = Number(v);
  if (!Number.isFinite(n)) return "₱--";
  return fmtPeso(v);
};

/** 千分位 + 带符号赢额：1234.5 → "+₱1,234.5"（WIN / 弹窗加额展示用） */
export const fmtWin = (v: string | number | null | undefined): string =>
  `+${fmtPeso(v)}`;

/** 非金额数字展示：最多 max 位小数并去尾零（倍率等） */
export const fmtDecimalText = (
  n: number,
  max = MONEY_MAX_DECIMALS,
): string => (Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(max))));

/**
 * 通用日期格式化（占位符：YYYY 年 / MM 月 / DD 日 / HH 时 / mm 分 / ss 秒）：
 * fmtDate(v) → "2026-09-17 18:31:05"，fmtDate(v, "HH:mm") → "18:31"。
 * 接受 ISO 字符串 / 时间戳 / Date；解析失败或空值回退空串（日期无 0 兜底语义）。
 */
export const fmtDate = (
  v: string | number | Date | null | undefined,
  format = "YYYY-MM-DD HH:mm:ss",
): string => {
  const d = v instanceof Date ? v : new Date(v ?? "");
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return format
    .replace(/YYYY/g, String(d.getFullYear()))
    .replace(/MM/g, pad(d.getMonth() + 1))
    .replace(/DD/g, pad(d.getDate()))
    .replace(/HH/g, pad(d.getHours()))
    .replace(/mm/g, pad(d.getMinutes()))
    .replace(/ss/g, pad(d.getSeconds()));
};

/** 时分秒：ISO → "18:31:05"（历史页列表/详情展示口径） */
export const fmtHM = (iso: string) => fmtDate(iso, "HH:mm:ss");

/** 历史列表/详情时间：2026.10.09 16:04:06（月日时分秒均补零） */
export const fmtHistoryTime = (iso: string | null | undefined): string =>
  iso ? fmtDate(iso, "YYYY.MM.DD HH:mm:ss") : "";

/** 日期标题：AUG 28, 2026 口径（历史页列表头） */
export const fmtDateHeading = (iso?: string) =>
  new Date(iso ?? Date.now())
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toUpperCase();

/**
 * 轮次 ID 展示口径：只取前 8 位给用户看（完整 ID 过长，如 r129380092858162 → "r1293800"）。
 * 仅限显示层使用——接口请求 / 路由跳转必须透传完整 roundId。
 */
export const fmtRoundId = (v: string | null | undefined, keep = 8): string =>
  (v ?? "").slice(0, keep);
