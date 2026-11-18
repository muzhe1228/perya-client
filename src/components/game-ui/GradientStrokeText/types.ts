export interface GradientStrokeTextShadow {
  dx?: number;
  dy?: number;
  blur?: number;
  color?: string;
  opacity?: number;
}

export interface GradientStrokeTextProps {
  text: string | number;
  /** 设计稿 px */
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  gradientColors?: string[];
  gradientStops?: number[];
  direction?: "vertical" | "horizontal" | "diagonal";
  strokeColor?: string;
  strokeGradientColors?: string[];
  strokeGradientStops?: number[];
  /** 设计稿 px */
  strokeWidth?: number;
  shadow?: GradientStrokeTextShadow | GradientStrokeTextShadow[] | null;
  /** 设计稿 px，超宽等比缩小 */
  maxWidth?: number;
  className?: string;
}