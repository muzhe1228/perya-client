import {
  useCallback,
  useLayoutEffect,
  useRef,
  type CSSProperties,
} from "react";
import { pxToRuntimePx, subscribeRem } from "@/utils/rem";

export interface FitWidthTextProps {
  /** 展示文案（已格式化的金额字符串） */
  text: string;
  className?: string;
  style?: CSSProperties;
  /** 设计稿 px，默认 16 */
  maxFontSize?: number;
  /** 设计稿 px，默认 10 */
  minFontSize?: number;
}

function measureTextSlotWidth(el: HTMLElement): number {
  const own = el.clientWidth;
  if (own > 0) return own;
  const parent = el.parentElement;
  if (!parent) return 0;
  const cs = getComputedStyle(parent);
  const padX =
    (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(0, parent.clientWidth - padX);
}

function fitFontSizePx(
  el: HTMLElement,
  maxPx: number,
  minPx: number,
): number {
  const width = measureTextSlotWidth(el);
  if (width <= 0) return maxPx;

  let lo = minPx;
  let hi = maxPx;
  let best = minPx;

  while (hi - lo > 0.25) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = `${mid}px`;
    if (el.scrollWidth <= width) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  el.style.fontSize = `${best}px`;
  return best;
}

/**
 * 在父级给定宽度内，按文案长度自动缩小字号（二分），避免金额撑破容器。
 * max/min 为设计稿 px，随 rem 基准换算为运行时像素。
 */
export function FitWidthText({
  text,
  className,
  style,
  maxFontSize = 16,
  minFontSize = 10,
}: FitWidthTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el || !text) return;

    const maxPx = pxToRuntimePx(maxFontSize);
    const minPx = pxToRuntimePx(minFontSize);
    fitFontSizePx(el, maxPx, minPx);
  }, [text, maxFontSize, minFontSize]);

  useLayoutEffect(() => {
    measure();
    const raf = requestAnimationFrame(() => measure());
    const el = ref.current;
    if (!el) return () => cancelAnimationFrame(raf);

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    const parent = el.parentElement;
    if (parent) ro.observe(parent);

    const offRem = subscribeRem(measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      offRem();
    };
  }, [measure]);

  const initialMaxPx = pxToRuntimePx(maxFontSize);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        ...style,
        fontSize: `${initialMaxPx}px`,
      }}
      title={text}
    >
      {text}
    </span>
  );
}
