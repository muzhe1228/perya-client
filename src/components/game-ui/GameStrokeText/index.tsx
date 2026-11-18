import type { CSSProperties } from "react";
import { pxToRem } from "@/utils/rem";
import "./index.scss";

const shadowPxToRem = (shadow: string) =>
  shadow.replace(/-?\d*\.?\d+px/g, (v) => pxToRem(parseFloat(v)));

/** text-shadow 无 inset；设计稿内阴影去掉 inset 后叠在前景层 */
const normalizeTextShadow = (shadow: string) =>
  shadow
    .split(/,(?![^()]*\))/)
    .map((part) => part.replace(/\binset\b/gi, "").trim())
    .filter(Boolean)
    .join(", ");

export interface GameStrokeTextProps {
  text: string | number;
  /** 纯色或 linear-gradient(...) */
  color?: string;
  strokeColor?: string;
  /** 设计稿 px；-webkit-text-stroke 总宽，0 = 无描边 */
  strokeWidth?: number;
  /** 设计稿 px 的 text-shadow，不传则无阴影 */
  shadow?: string;
  className?: string;
}

/** CSS 双层描边字：::before 承担描边+阴影，顶层填充（支持渐变 clip） */
export function GameStrokeText({
  text,
  color = "#fff",
  strokeColor = "#2f2c85",
  strokeWidth = 5,
  shadow,
  className,
}: GameStrokeTextProps) {
  const isGradient = color.includes("gradient");
  const cssShadow = shadow ? shadowPxToRem(normalizeTextShadow(shadow)) : "none";
  const style: CSSProperties = {
    "--gst-stroke-color": strokeColor,
    "--gst-stroke-width": pxToRem(strokeWidth),
    "--gst-before-color": strokeWidth > 0 && !isGradient ? strokeColor : "transparent",
    "--gst-shadow": cssShadow,
    ...(isGradient
      ? {
          backgroundImage: color,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }
      : { "--gst-color": color }),
  };

  return (
    <span
      className={`game-stroke-text${isGradient ? " game-stroke-text--gradient" : ""}${className ? ` ${className}` : ""}`}
      data-text={text}
      style={style}
    >
      {text}
    </span>
  );
}