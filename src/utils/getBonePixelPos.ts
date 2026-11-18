import type { SpinePlayer } from "@esotericsoftware/spine-player";

/**
 * 计算 spine-player 中指定骨骼的屏幕像素位置
 * 用于在骨骼位置叠加 HTML 元素（如金额文字、特效等）
 */
export function getBonePixelPos(
  player: SpinePlayer,
  boneName: string,
): { x: number; y: number; rotation: number } | null {
  if (!player || !player.skeleton) return null;

  const skeleton = player.skeleton;
  const bone = skeleton.findBone(boneName);
  if (!bone) return null;

  const pose = bone.appliedPose;
  const camera = player.sceneRenderer?.camera;
  const cameraPositionX = camera?.position.x ?? 0;
  const cameraPositionY = camera?.position.y ?? 0;
  const cameraZoom = camera?.zoom || 1;

  const canvas = player.canvas;
  const canvasWidth = canvas?.width ?? 0;
  const canvasHeight = canvas?.height ?? 0;

  const worldX = pose.worldX;
  const worldY = pose.worldY;
  const worldOffsetX = worldX - cameraPositionX;
  const worldOffsetY = worldY - cameraPositionY;
  const worldXtoPx = worldOffsetX / cameraZoom;
  const worldYtoPx = worldOffsetY / cameraZoom;

  // 屏幕像素 = Canvas中心 + 世界坐标偏移 / camera.zoom
  const pixelX = canvasWidth / 2 + worldXtoPx;
  // Y轴翻转：屏幕 Y = Canvas高度/2 - (Spine世界Y - 相机Y) / zoom
  const pixelY = canvasHeight / 2 - worldYtoPx;

  // 适配屏幕显示比例 (CSS Pixels)
  const dpr = window.devicePixelRatio || 1;
  // 旋转角度转换 (Spine 逆时针 -> CSS 顺时针)
  const rotation = -pose.getWorldRotationX();

  return {
    x: pixelX / dpr,
    y: pixelY / dpr,
    rotation,
  };
}