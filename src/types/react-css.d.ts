import "react";

/** inline style 支持 --自定义属性（GameStrokeText 等） */
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}