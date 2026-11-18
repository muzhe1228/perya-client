import { pxToRuntimePx } from "@/utils/rem";
import type { GradientStrokeTextProps, GradientStrokeTextShadow } from "./types.ts";

export const GRAD_COORDS: Record<
  NonNullable<GradientStrokeTextProps["direction"]>,
  [string, string, string, string]
> = {
  vertical: ["0%", "0%", "0%", "100%"],
  horizontal: ["0%", "0%", "100%", "0%"],
  diagonal: ["0%", "0%", "100%", "100%"],
};

/** 滚字金额类字符串：位数变、形状不变时可跳过 getBBox */
export const ROLLING_AMOUNT_TEXT = /^[\d.,\s₱+=x]*$/i;

export function evenStops(count: number, custom?: number[]): number[] {
  if (custom?.length) return custom;
  return Array.from({ length: count }, (_, i) => (i / Math.max(count - 1, 1)) * 100);
}

export function safeStopOffset(v: number | undefined): number {
  return v != null && Number.isFinite(v) ? v : 0;
}

export function estimateTextBox(fontSizePx: number, text: string, margin: number) {
  const estW = fontSizePx * 0.62 * Math.max(text.length, 1) + margin * 2;
  const estH = fontSizePx * 1.1 + margin * 2;
  return { viewBox: `${-estW / 2} ${-estH / 2} ${estW} ${estH}`, w: estW, h: estH };
}

export function normalizeShadows(
  shadow: GradientStrokeTextProps["shadow"],
): Array<Required<Pick<GradientStrokeTextShadow, "dx" | "dy" | "blur">> & { color: string; opacity: number }> {
  if (shadow === null) return [];
  const layers = shadow == null ? [{}] : Array.isArray(shadow) ? shadow : [shadow];
  return layers.map((s) => ({
    dx: pxToRuntimePx(s.dx ?? 0),
    dy: pxToRuntimePx(s.dy ?? 3),
    blur: pxToRuntimePx(s.blur ?? 3),
    color: s.color ?? "rgba(0,0,0,0.5)",
    opacity: s.opacity ?? 1,
  }));
}

export function shadowMargin(
  shadows: ReturnType<typeof normalizeShadows>,
  strokeWidthPx: number,
): number {
  return shadows.reduce(
    (m, s) => Math.max(m, s.blur + Math.max(Math.abs(s.dx), Math.abs(s.dy)) + strokeWidthPx),
    strokeWidthPx,
  );
}