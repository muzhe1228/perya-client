import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { getRemBase, pxToRuntimePx, subscribeRem } from "@/utils/rem";
import {
  estimateTextBox,
  evenStops,
  GRAD_COORDS,
  normalizeShadows,
  ROLLING_AMOUNT_TEXT,
  safeStopOffset,
  shadowMargin,
} from "./strokeTextUtils.ts";
import type { GradientStrokeTextProps } from "./types.ts";
import "./index.scss";

/** SVG 渐变描边字（transform 合成层内比 background-clip:text 稳定） */
export function GradientStrokeText({
  text,
  fontSize = 34,
  fontFamily,
  fontWeight = 800,
  gradientColors = ["#FBE782", "#FFF6C3", "#FCD571", "#F5BA3A"],
  gradientStops,
  direction = "vertical",
  strokeColor = "#E810C7",
  strokeGradientColors,
  strokeGradientStops,
  strokeWidth = 3,
  shadow,
  maxWidth,
  className,
}: GradientStrokeTextProps) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `gst-grad-${uid}`;
  const strokeGradientId = `gst-stroke-grad-${uid}`;
  const shadowId = `gst-shadow-${uid}`;
  const contentRef = useRef<SVGGElement | null>(null);

  useSyncExternalStore(subscribeRem, getRemBase);

  const [x1, y1, x2, y2] = GRAD_COORDS[direction];
  const fontSizePx = pxToRuntimePx(fontSize);
  const strokeWidthPx = pxToRuntimePx(strokeWidth);
  const shadowsPx = normalizeShadows(shadow);
  const margin = shadowMargin(shadowsPx, strokeWidthPx);

  const [viewBox, setViewBox] = useState(() => estimateTextBox(fontSizePx, String(text), margin).viewBox);
  const [size, setSize] = useState(() => {
    const e = estimateTextBox(fontSizePx, String(text), margin);
    return { w: e.w, h: e.h };
  });

  const applyEstimated = useCallback(() => {
    const e = estimateTextBox(fontSizePx, String(text), margin);
    setViewBox(e.viewBox);
    setSize({ w: e.w, h: e.h });
  }, [fontSizePx, text, margin]);

  const updateViewBox = useCallback(() => {
    const g = contentRef.current;
    if (!g) return;
    const bbox = g.getBBox();
    const x = bbox.x - margin;
    const y = -(bbox.height - 3 + margin * 2) / 2;
    const w = bbox.width + margin * 2;
    const h = bbox.height + margin * 2;
    setViewBox(`${x} ${y} ${w} ${h}`);
    setSize({ w, h });
  }, [margin]);

  const lastGeoRef = useRef({ key: "", text: "" });
  useEffect(() => {
    const str = String(text);
    const key = `${fontSizePx}|${margin}|${str.length}`;
    const last = lastGeoRef.current;
    if (ROLLING_AMOUNT_TEXT.test(str) && ROLLING_AMOUNT_TEXT.test(last.text) && key === last.key) {
      return;
    }
    lastGeoRef.current = { key, text: str };
    applyEstimated();
    updateViewBox();
  }, [applyEstimated, updateViewBox, text, fontSizePx, margin]);

  const fillStops = evenStops(gradientColors.length, gradientStops);
  const strokeStops = strokeGradientColors?.length
    ? evenStops(strokeGradientColors.length, strokeGradientStops)
    : [];

  const maxW = maxWidth != null ? pxToRuntimePx(maxWidth) : null;
  const renderW = maxW != null ? Math.min(size.w, maxW) : size.w;
  const renderH = size.h * (renderW / size.w);

  const textCommon = {
    x: 0,
    y: 0,
    textAnchor: "middle" as const,
    dominantBaseline: "central" as const,
    fontSize: fontSizePx,
    fontFamily,
    fontWeight,
    textRendering: "geometricPrecision" as const,
  };

  return (
    <svg
      className={`gradient-stroke-text${className ? ` ${className}` : ""}`}
      viewBox={viewBox}
      width={renderW}
      height={renderH}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
          {gradientColors.map((c, i) => (
            <stop key={i} offset={`${safeStopOffset(fillStops[i])}%`} stopColor={c} />
          ))}
        </linearGradient>
        {strokeGradientColors?.length ? (
          <linearGradient id={strokeGradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
            {strokeGradientColors.map((c, i) => (
              <stop key={i} offset={`${safeStopOffset(strokeStops[i])}%`} stopColor={c} />
            ))}
          </linearGradient>
        ) : null}
        {shadowsPx.length ? (
          <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
            {shadowsPx.map((s, i) => (
              <feDropShadow
                key={i}
                in={i === 0 ? "SourceGraphic" : `gst-sh-${uid}-${i - 1}`}
                result={`gst-sh-${uid}-${i}`}
                dx={s.dx}
                dy={s.dy}
                stdDeviation={s.blur}
                floodColor={s.color}
                floodOpacity={s.opacity}
              />
            ))}
          </filter>
        ) : null}
      </defs>
      <g ref={contentRef} filter={shadowsPx.length ? `url(#${shadowId})` : undefined}>
        <text
          {...textCommon}
          fill="none"
          stroke={strokeGradientColors?.length ? `url(#${strokeGradientId})` : strokeColor}
          strokeWidth={strokeWidthPx}
          strokeLinejoin="round"
        >
          {text}
        </text>
        <text {...textCommon} fill={`url(#${gradientId})`} stroke="none">
          {text}
        </text>
      </g>
    </svg>
  );
}