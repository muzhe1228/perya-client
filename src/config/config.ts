/**
 * 设计稿 432×768（9:16，Figma H5 @1x；@2x 画板为 864×1536）。
 * SCSS 里写的 px 按本宽度折 rem（PostCSS root = DESIGN_WIDTH × 10）。
 * 运行时 html font-size = 实际壳「内容宽」÷ 10（见 rem.ts），不必等于 DESIGN_WIDTH÷10；
 * 例如 DevTools 375 宽 → rem≈37.5；壳宽 432 时 → rem≈43.2。
 * 壳：Web(≥768) 为 9:16 手机框；移动端(≤767) 宽 100% + 100dvh，高度可不按 9:16。
 */
export const DESIGN_WIDTH = 432;
export const DESIGN_HEIGHT = 768;

export const PC_HEIGHT_VH = 96;
export const SHELL_WIDTH_VH = PC_HEIGHT_VH * (DESIGN_WIDTH / DESIGN_HEIGHT);
export const PC_BOUNDARY = 767;
