# SpinePlayer 使用文档

React 封装的 Spine 4.3 动画组件（**perya-client** 通用渲染层）。适用于弹窗演出、按钮特效、骨骼挂点 DOM 跟随等场景。

- 运行时（`@esotericsoftware/spine-player` 4.3.x）与控制条 CSS 挂载后动态加载，**不进主包**
- 仅支持 **Spine 4.3 导出**的素材
- 多实例相互独立，可同时播放

## 快速上手

```tsx
import { SpinePlayer, type SpinePlayerHandle } from "@/components/SpinePlayer";

const ref = useRef<SpinePlayerHandle>(null);

<div style={{ width: "100%", height: "3rem" }}>
  <SpinePlayer
    ref={ref}
    baseUrl="/spine/top-show"
    name="mask_top"
    binary
    showOverlay={false}
    onLoaded={() => ref.current?.playAnimation("animation", true)}
  />
</div>
```

素材要求：`baseUrl` 目录下有同名骨骼 + atlas 文件。`binary` 为 true 时使用 `name.skel.bytes` + `name.atlas.txt`。

## Props

常见：`baseUrl`、`name`、`binary`、`scale`、`autoFit`、`autoFitBasis`、`fitViewportToContainer`、`fps`、`fullResolution`、`hideOnEnd`、`trackBones`、`onLoaded` / `onEnd` / `onError`。

`scale` / `autoFit*` / `fps` 等加载期参数变化会**重建 player**。

## Ref 方法

| 方法 | 说明 |
| --- | --- |
| `playAnimation(animName, loop?, trackIndex?, speed?)` | 播放动画；未就绪时挂起请求，加载完成后补播 |
| `seekTo(animName, time)` | 定位到指定时刻并冻结 |
| `getAnimations()` | 返回全部动画名 |
| `pauseRendering()` / `resumeRendering()` | 手动停绘/恢复 |

## 尺寸与性能

- 父容器须有确定宽高（`width/height: 100%` 填满父级）
- 默认 `autoFit` 加载后锁定视口；`autoFitBasis="setup"` 对齐美术编辑器构图
- 不播放时 `paused + stopRendering`，零持续 GPU 占用
- DPR 默认经 `resolveSpineDevicePixelRatio()` 钳制；`fullResolution` 可走设备原生分辨率
- WebGL context lost 时销毁重建并按快照续播
- 卸载 `dispose` + `loseContext` 归还 WebGL 槽位

## 本地验证

在业务页按需挂载 `SpinePlayer` 即可（当前无独立演示路由）。
