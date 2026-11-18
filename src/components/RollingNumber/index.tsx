import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { pxToRuntimePx } from "@/utils/rem";
import "./index.scss";

/**
 * 图片数字滚动组件（mainNum / slotNum / multNum / subNum 四套素材）。
 *
 * 实现与性能口径：
 * - 每个数字位一个竖直滚轮（0-9 十张图叠放、外层 overflow hidden），
 *   值变化时 translateY 切换 + CSS transition —— 合成器线程动画，
 *   不占 JS 主线程、不触发布局/重绘；每位 10 张小图仅 1 张可见；
 * - 数字变化低频（下注结算/次数递减），滚动一次 ≤ 数百 ms，无持续开销；
 * - 符号字符（, + p）不走滚轮，静态 img 与数字同高对齐；
 * - 位间错峰：右起每位延迟 staggerMs（低位先动，进位滚动感）。
 *
 * 尺寸跟随字体：cell 高 1em、宽自适应——调用方用 font-size 控制大小。
 * 值格式化（千分位/货币）由调用方完成（fmtMoney / fmtPeso），组件只渲染字符序列。
 */

export interface RollingNumberProps {
  /** 显示值：数字或字符序列（数字字符走滚轮，其余符号查素材表静态渲染） */
  value: string | number;
  /** 数字高（设计稿 px，经 pxToRuntimePx 换算，口径同 GradientStrokeText.fontSize）；
   *  不传 = 跟随继承的 font-size（cell 高 1em） */
  fontSize?: number;
  /** 位间滚动错峰（右起每位递增），0 = 同时滚 */
  staggerMs?: number;
  /** 单位滚动时长 */
  durationMs?: number;
  /** 是否启用滚动动画（默认 true）；false = 值变化直接跳变（duration 归零） */
  animated?: boolean;
  /** 最大宽度（设计稿 px，同 GradientStrokeText.maxWidth 口径）：内容超宽时
   *  整体等比缩小字号适配；值变化自动重测（位数变少会回弹到原字号，与 SVG 版同语义） */
  maxWidth?: number;
  /** 字号预估基准字符序列（如 count-up 的终值 "₱1,250,000"）：提供时 fit 按
   *  该序列的素材宽度纯计算一次性锁定——滚动中位数增长字号恒定、绝不超宽
   *  （不提供则按当前值逐帧 DOM 测量，字号会"追着位数跑"）。需与 fontSize 同传 */
  fitChars?: string;
  /** 滚动脉冲（默认关）：值变化滚动期间整体放大 + 金色光晕，滚完平滑收回——
   *  transform/filter 合成器友好，小元素开销可忽略 */
  rollPulse?: boolean;
  /** 字符间距（em，默认 0，负值收紧）：作用于相邻字符之间（首字符不受影响）。
   *  注意 letter-spacing 对本组件无效——字符是 inline-flex 子项非文本流；
   *  flex gap 也不收负值，内部用 margin 实现。fitChars 预估已含本间距 */
  charGap?: number;
  className?: string;
}

interface SymbolImages {
  [sym: string]: string;
}

/** 符号排版例外：紧凑画布素材（高度与数字素材不一致，如 mainNum 逗号 19×66 vs 数字高 71）
 *  不能参与统一 1em 高规则，按原始比例缩放显示 */
interface SymbolOverride {
  /** 显示高度（em，相对数字高 1em） */
  height: number;
  /** 显示宽度（em）：数字位滚轮的槽宽 = 墨迹宽 / 数字画布高。
   *  必须用墨迹（alpha 包围盒）而非画布宽——素材画布可能带水平内边距
   *  （等宽画布素材里 1 的墨迹只占中段），按画布宽排布会让 1 两侧
   *  空出大块，按最宽者更会拉伸变形 */
  width?: number;
  /** 墨迹左偏移（em，≤0）：数字位专用——槽（= 墨迹宽）窄于图片，
   *  负偏移把图片左移让墨迹左缘贴槽左缘，画布左内边距被 overflow 裁掉 */
  inkLeft?: number;
  /** 贴底对齐（逗号/小数点等下标符号：墨迹悬在基线下方） */
  alignBottom?: boolean;
  /** 垂直居中对齐（+ 号等整体符号：紧裁切画布下缘贴底会误判成下标——
   *  按「墨迹是否从画布下半才开始」区分，见 resolveSymbolOverrides） */
  alignCenter?: boolean;
}
type SymbolOverrides = Record<string, SymbolOverride>;

/** glob 结果（路径 → url）→ 符号表（文件名去扩展名即符号） */
function toSymbols(modules: Record<string, string>): SymbolImages {
  const out: SymbolImages = {};
  for (const [path, url] of Object.entries(modules)) {
    out[path.split("/").pop()!.replace(/\.png$/, "")] = url;
  }
  return out;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/** 字符序列预估宽（em）：数字按墨迹槽宽、符号按画布宽（overrides 未覆盖的字符兜底 0.6em）——
 *  fitChars 字号预估用，与主行排版同数据源（纯计算无 DOM 回流） */
function calcWidthEm(chars: readonly string[], overrides?: SymbolOverrides): number {
  let w = 0;
  for (const c of chars) {
    const sym = CHAR_ALIAS[c] ?? c;
    w += overrides?.[sym]?.width ?? 0.6;
  }
  return w;
}

/** 值字符 → 素材符号名别名：调用方格式化输出标准字符（. 小数点 / ₱ 货币符），
 *  素材文件名为语义名（dot.png / p.png），渲染查表前先换名 */
const CHAR_ALIAS: Record<string, string> = {
  ".": "dot",
  "₱": "p",
  // 倍率后缀：调用方习惯输出大写 X（fmtWheelMult 等），素材文件名为小写 x
  X: "x",
};

/** 单个数字位滚轮：10 格竖排，translateY(-digit × 10%)（百分比相对 reel 自身 = 10 格高）。
 *  durationMs=0（animated=false）走静态单图：不滚就不需要 10 格滚轮——
 *  wheel strip 303 格 / Treasure 20 格全量挂载时，每数字位 10 img → 1 img
 *  （~3900 → ~900 img），DOM 与解码列表双降；渲染结构与槽宽口径与滚轮态一致 */
function DigitReel({
  digit,
  images,
  overrides,
  delayMs,
  durationMs,
}: {
  digit: number;
  images: SymbolImages;
  overrides?: SymbolOverrides;
  delayMs: number;
  durationMs: number;
}) {
  // 槽宽 = 本数字墨迹宽（不是画布宽）：素材画布可能带水平内边距，
  // 等宽画布素材里 1 的墨迹只占中段，按画布宽排布会空出很大一块
  const ov = overrides?.[String(digit)];
  const widthEm = ov?.width;
  // 裁切窗恒宽 = 全数字最大墨迹宽：布局槽宽跟随数字变化（count-up 每帧换数字，
  // width 过渡追不上），窗口一旦比当前字形墨迹窄就右裁墨迹（2026-10-16 裁切
  // 根因）。窗恒取最大 → 永远 ≥ 任何可见字形；占位仍按本数字墨迹宽负
  // margin-right 回收，相邻排版/fitChars 预估口径不变
  const winEm = Math.max(...DIGITS.map((d) => overrides?.[d]?.width ?? 0.6));
  if (durationMs === 0) {
    const src = images[String(digit)];
    if (!src) return null;
    return (
      <span
        className="rn-digit"
        style={
          widthEm != null
            ? { width: `${winEm}em`, marginRight: `${-(winEm - widthEm)}em` }
            : undefined
        }
      >
        <img
          src={src}
          className="rn-cell"
          alt=""
          draggable={false}
          // 画布高 ≠ 基准（0 号）时按比例缩放显示（img 高 = canvasH/baseH em，
          // 见 resolveSymbolOverrides）——混排画布高素材（mainNum 2026-10-16：
          // 104/105/107 混排）下各数字像素比例恒 1/baseH，字号/基线一致
          style={{
            ...(ov?.height != null && ov.height !== 1 ? { height: `${ov.height}em` } : {}),
            ...(ov?.inkLeft ? { marginLeft: `${ov.inkLeft}em` } : {}),
          }}
        />
      </span>
    );
  }
  return (
    <span
      className="rn-digit"
      style={{
        ...(widthEm != null
          ? { width: `${winEm}em`, marginRight: `${-(winEm - widthEm)}em` }
          : {}),
        // 占位宽随数字切换平滑过渡（窗口恒宽不动，过渡的是回收的负 margin），
        // 与滚轮位移同步（避免滚动中右侧位突跳）
        transitionProperty: "margin-right",
        transitionTimingFunction: "cubic-bezier(0.22, 0.61, 0.36, 1)",
        transitionDuration: `${durationMs}ms`,
        transitionDelay: durationMs > 0 ? `${delayMs}ms` : "0ms",
      }}
    >
      <span
        className="rn-reel"
        style={{
          transform: `translateY(-${digit * 10}%)`,
          // duration 归零 = 关闭滚动（直接跳变），delay 同步清零避免残留等待
          transitionDelay: durationMs > 0 ? `${delayMs}ms` : "0ms",
          transitionDuration: `${durationMs}ms`,
        }}
      >
        {DIGITS.map((d) => {
          const dov = overrides?.[d];
          if (!images[d]) return null;
          return (
            // 行壳恒 1em：滚轮 translateY(-d×10%) 按行数均分，画布高混排素材的
            // 数字 img 高 ≠ 1em（canvasH/baseH）时由壳保证行距等分不被破坏
            <span key={d} className="rn-reel-row">
              <img
                src={images[d]}
                className="rn-cell"
                alt=""
                draggable={false}
                style={{
                  ...(dov?.height != null && dov.height !== 1 ? { height: `${dov.height}em` } : {}),
                  ...(dov?.inkLeft ? { marginLeft: `${dov.inkLeft}em` } : {}),
                }}
              />
            </span>
          );
        })}
      </span>
    </span>
  );
}

function RollingNumber({
  value,
  images,
  symbolOverrides,
  fontSize,
  staggerMs = 40,
  durationMs = 350,
  animated = true,
  maxWidth,
  fitChars,
  rollPulse = false,
  charGap = 0,
  className,
}: RollingNumberProps & { images: SymbolImages; symbolOverrides?: SymbolOverrides }) {
  const chars = useMemo(() => String(value).split(""), [value]);
  // 关闭动画：所有位 duration 归零（DigitReel 内据此同时清 delay）
  const reelDuration = animated ? durationMs : 0;
  // 滚动脉冲：值变化时置 is-rolling 一拍（总时长 = 滚动 + 最大错峰 + 余量），滚完收回
  const [rolling, setRolling] = useState(false);
  const prevValueRef = useRef(value);
  const pulseTimerRef = useRef(0);
  useEffect(() => {
    if (prevValueRef.current === value) return;
    prevValueRef.current = value;
    if (!rollPulse || !animated) return;
    setRolling(true);
    window.clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = window.setTimeout(
      () => setRolling(false),
      reelDuration + (chars.length - 1) * staggerMs + 80,
    );
    return () => window.clearTimeout(pulseTimerRef.current);
  }, [value, rollPulse, animated, reelDuration, chars.length, staggerMs]);
  // maxWidth 自适应：超宽等比缩字号。测量必须在"自然排版"（fit=1）下进行——
  // 数字槽宽度有 350ms 过渡动画，fit 变化后立刻重测会量到动画中间值（偏大），
  // 每轮收敛都按虚高值缩 → 级联过度缩小（刷新页面后尤其明显，字号缩成一小团）。
  // 测量流程（全在 layout 阶段同步完成，无中间帧）：
  //   1. 挂 is-measuring 关掉槽宽过渡；2. 临时恢复 fit=1 字号；3. 强制回流读自然宽；
  //   4. 还原字号/类名。effect 因 setFit 重跑时测到的自然宽恒定不变 → 收敛稳定。
  // 素材尺寸表（symbolOverrides）未就绪时跳过：未就绪按画布宽排版，测量虚高。
  const metricsReady = symbolOverrides != null;
  const rootRef = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    if (maxWidth == null || !metricsReady) return;
    const el = rootRef.current;
    if (!el) return;
    let target: number;
    let natural: number;
    const limit = pxToRuntimePx(maxWidth);
    if (fitChars != null && fontSize != null) {
      // 终值预估：按 fitChars 素材宽纯计算一次锁定——count-up 位数增长全程字号恒定，
      // 不随当前值逐帧重测（滚动中超宽/字号跳变的根治）。与 value 无关但 deps 含 value
      // 重跑纯计算无妨（廉价、幂等）。charGap 计入（相邻 margin，scrollWidth 测不到）
      natural =
        (calcWidthEm(Array.from(fitChars), symbolOverrides) +
          (fitChars.length - 1) * charGap) *
        pxToRuntimePx(fontSize);
    } else {
      el.classList.add("is-measuring");
      const prevFont = el.style.fontSize;
      el.style.fontSize = fontSize != null ? `${pxToRuntimePx(fontSize)}px` : "";
      void el.offsetWidth; // 强制回流，让测量排版先生效
      natural = el.scrollWidth;
      el.style.fontSize = prevFont;
      el.classList.remove("is-measuring");
    }
    // 收敛阈值按 limit 尺度放宽到 ~2px：scrollWidth 整数取整在边界 ±1px 摆动，
    // 固定 0.001 挡不住会无限往返（Maximum update depth exceeded）
    const eps = Math.max(0.001, 2 / limit);
    target = natural > limit ? limit / natural : 1;
    if (Math.abs(target - fit) > eps) setFit(target);
  }, [value, fitChars, maxWidth, fontSize, fit, metricsReady, symbolOverrides]);
  return (
    <span
      ref={rootRef}
      className={`rolling-number${rolling ? " is-rolling" : ""}${className ? ` ${className}` : ""}`}
      style={
        {
          ...(fontSize != null
            ? { fontSize: `${pxToRuntimePx(fontSize) * fit}px` }
            : fit !== 1
              ? { fontSize: `${fit}em` }
              : {}),
          // 字符间距（相邻 margin，见 charGap prop 注释）
          ...(charGap !== 0 ? { "--rn-char-gap": `${charGap}em` } : {}),
        } as CSSProperties
      }
    >
      {chars.map((c, i) => {
        const sym = CHAR_ALIAS[c] ?? c;
        if (/^[0-9]$/.test(c) && images[c]) {
          return (
            <DigitReel
              key={i}
              digit={Number(c)}
              images={images}
              delayMs={(chars.length - 1 - i) * staggerMs}
              durationMs={reelDuration}
              overrides={symbolOverrides}
            />
          );
        }
        if (images[sym]) {
          // 墨迹槽排版（同数字位）：槽宽 = 墨迹宽（overflow 裁画布右内边距）、
          // img marginLeft = inkLeft 裁左内边距——符号与数字墨迹贴墨迹，间距均匀；
          // 高度按画布比例缩放（默认 1em 会把矮画布符号放大成数字同高）。
          // 未测得 ov（异常兜底）退回裸 img 原比例
          const ov = symbolOverrides?.[sym];
          if (!ov) {
            return (
              <img key={i} src={images[sym]} className="rn-sym" alt="" draggable={false} />
            );
          }
          return (
            <span
              key={i}
              className="rn-sym-slot"
              style={{
                width: `${ov.width}em`,
                height: `${ov.height}em`,
                ...(ov.alignBottom ? { alignSelf: "flex-end" } : {}),
                ...(ov.alignCenter ? { alignSelf: "center" } : {}),
              }}
            >
              <img
                src={images[sym]}
                className="rn-sym"
                alt=""
                draggable={false}
                style={ov.inkLeft ? { marginLeft: `${ov.inkLeft}em` } : undefined}
              />
            </span>
          );
        }
        // 素材表没有的字符兜底为文本，同高对齐
        return (
          <span key={i} className="rn-sym rn-fallback">
            {c}
          </span>
        );
      })}
    </span>
  );
}

/* 符号尺寸自测量：素材更新零代码适配（历史手测表已两次因美术重导失准）。
 * 原理：加载符号 PNG → canvas 扫 alpha 包围盒 → 与数字画布高（"0" 的 naturalHeight）
 * 对比——全高画布（基线已烘进素材）1em 直出；矮画布按 canvas 高比例缩放，
 * 内容贴底（逗号/点等下标符号）加 alignBottom 悬挂下探基线，否则顶对齐。
 * 模块加载即预热测量（eager glob 图片已在内存，只差 alpha 扫描，毫秒级），
 * 首个消费者挂载时结果已就绪，无 1em 闪变 */

interface MeasuredImage {
  canvasW: number;
  canvasH: number;
  bboxLeft: number;
  bboxRight: number;
  bboxTop: number;
  bboxBottom: number;
}

async function measureImage(url: string): Promise<MeasuredImage | null> {
  const img = new Image();
  img.src = url;
  try {
    if (typeof img.decode === "function") await img.decode();
    else await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); });
  } catch {
    return null;
  }
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  try {
    const data = ctx.getImageData(0, 0, w, h).data;
    let top = -1;
    let bottom = -1;
    for (let y = 0; y < h && top === -1; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 8) { top = y; break; }
      }
    }
    for (let y = h - 1; y >= 0 && bottom === -1; y--) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 8) { bottom = y; break; }
      }
    }
    if (top === -1) return null; // 全透明
    let left = -1;
    let right = -1;
    for (let x = 0; x < w && left === -1; x++) {
      for (let y = 0; y < h; y++) {
        if (data[(y * w + x) * 4 + 3] > 8) { left = x; break; }
      }
    }
    for (let x = w - 1; x >= 0 && right === -1; x--) {
      for (let y = 0; y < h; y++) {
        if (data[(y * w + x) * 4 + 3] > 8) { right = x; break; }
      }
    }
    return { canvasW: w, canvasH: h, bboxLeft: left, bboxRight: right, bboxTop: top, bboxBottom: bottom };
  } catch {
    return null; // 画布被污染等异常：退回 1em 直出
  }
}

const overridesCache = new Map<SymbolImages, Promise<SymbolOverrides>>();
/** 已解析结果同步表：预热先于首个挂载完成（常态），挂载首帧即拿到终值零闪变 */
const resolvedCache = new Map<SymbolImages, SymbolOverrides>();

function resolveSymbolOverrides(images: SymbolImages): Promise<SymbolOverrides> {
  const cached = overridesCache.get(images);
  if (cached) return cached;
  const job = (async () => {
    const base = await measureImage(images["0"]);
    if (!base) return {};
    const out: SymbolOverrides = {};
    await Promise.all(
      Object.entries(images).map(async ([sym, url]) => {
        const m = await measureImage(url);
        if (!m) return;
        if (/^[0-9]$/.test(sym)) {
          // 数字：全部按基准（0 号）画布高归一——width/inkLeft 用 baseH 而非各自
          // canvasH，配合 DigitReel 的 img 高度覆盖（canvasH/baseH em），混排画布高
          // 素材（mainNum 2026-10-16：104/105/107）下每个数字的像素比例恒 1/baseH，
          // 字号/基线一致（旧口径各自 /canvasH，104 画布字会比 107 大 ~3%）
          out[sym] = {
            height: m.canvasH / base.canvasH,
            width: (m.bboxRight - m.bboxLeft + 1) / base.canvasH,
            inkLeft: -m.bboxLeft / base.canvasH,
          };
          return;
        }
        // 符号：与数字同款墨迹排版（槽宽 = 墨迹宽 + inkLeft 裁画布左内边距，
        // 右内边距由槽 overflow 裁掉）——画布宽排版会把 x/₱ 等素材两侧透明
        // 边距算进占位，字符间距虚大不均匀（multNum 的 x 曾明显偏松）。
        // width 同样按 baseH 归一（与 img 高 canvasH/baseH 配套），同时供
        // fitChars 纯计算预估（与渲染同源，预估更准）
        out[sym] = {
          height: m.canvasH / base.canvasH,
          width: (m.bboxRight - m.bboxLeft + 1) / base.canvasH,
          inkLeft: -m.bboxLeft / base.canvasH,
          // 垂直对齐（矮/异高画布符号，画布高 ≠ 基准时才判）：
          //  下标符号（逗号/小数点）——墨迹主体从画布下半才开始 → 悬挂贴底
          //  （不要求下缘贴底：美术会留底部余量，mainNum/slotNum 2026-10-16 版
          //    逗号下缘各留 1~24px，旧「贴底」硬条件会漏判）；
          //  整体符号（+ 号）——墨迹占满画布大部、只是紧裁切导致下缘贴底，
          //    旧规则会误判成下标吊到行底（+ inkTop 0.17，dot/逗号 0.39~0.56）
          //    → 居中
          ...(m.canvasH !== base.canvasH
            ? m.bboxTop > m.canvasH * 0.35
              ? { alignBottom: true }
              : { alignCenter: true }
            : {}),
        };
      }),
    );
    resolvedCache.set(images, out);
    return out;
  })();
  overridesCache.set(images, job);
  return job;
}

/** 消费侧 hook：同步初值取已解析缓存（预热常态命中→零额外渲染），
 *  极端未就绪时先 1em 渲染、解析完成后微调一次 */
function useSymbolOverrides(images: SymbolImages): SymbolOverrides | undefined {
  const [ov, setOv] = useState<SymbolOverrides | undefined>(() => resolvedCache.get(images));
  useEffect(() => {
    if (ov) return;
    let alive = true;
    void resolveSymbolOverrides(images).then((v) => {
      if (alive) setOv(v);
    });
    return () => {
      alive = false;
    };
  }, [images, ov]);
  return ov;
}

/* 各套素材的具名组件（素材符号集见各自目录，尺寸一律自测量生成，无需手测表） */

const mainImages = toSymbols(
  import.meta.glob("@/assets/images/mainNum/*.png", { eager: true, import: "default" }) as Record<string, string>,
);

void resolveSymbolOverrides(mainImages);

/** 主界面金额（余额/注额/WIN/TOTAL）：支持 , 千分位 + 号、. 小数点与 ₱ 货币符
 *  （CHAR_ALIAS 映射）；默认开启滚动脉冲（滚动放大+金晕、滚完收回），传
 *  rollPulse=false 关闭。
 *  注意：mainNum 素材 2026-10-16 版墨迹紧贴画布左右缘（零侧边距），墨迹贴墨迹
 *  排版下不传 charGap 即 0 间距（大字号互压）——需要呼吸位的调用方显式传
 *  charGap（em），或美术在素材侧补留白（根治） */
export function MainNum(props: RollingNumberProps) {
  return (
    <RollingNumber
      {...props}
      rollPulse={props.rollPulse ?? true}
      images={mainImages}
      symbolOverrides={useSymbolOverrides(mainImages)}
    />
  );
}

