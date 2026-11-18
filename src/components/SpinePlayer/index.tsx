import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  type ReactNode,
} from "react";
import {
  SpinePlayer as EsotericSpinePlayer,
  type SpinePlayer as EsotericSpinePlayerInstance,
  type SpinePlayerConfig,
  type TrackEntry,
} from "@esotericsoftware/spine-player";
import "@esotericsoftware/spine-player/dist/spine-player.css";
import { bindSpineRenderLoop } from "@/components/spineRenderLoop";
import { resolveSpineDevicePixelRatio } from "@/config/spineDevicePixelRatio";
import { getBonePixelPos } from "@/utils/getBonePixelPos";
import "./index.scss";

/** 骨骼追踪数据：骨骼在屏幕上的像素坐标和旋转角度 */
interface BoneData {
  x: number;
  y: number;
  rotation: number;
}

/** 组件对外暴露的命令式接口（通过 ref 调用） */
export interface SpinePlayerHandle {
  playAnimation: (animName: string, loop?: boolean, trackIndex?: number, speed?: number) => void;
  setSkin: (skinName: string) => void;
  getAnimations: () => string[];
}

export interface SpinePlayerProps {
  /** 资源路径前缀，如 "/spine/" */
  baseUrl: string;
  /** 资源名称（不含后缀） */
  name: string;
  /** 二进制 skeleton（.skel.bytes + .atlas.txt） */
  binary?: boolean;
  /** 不钳制 sceneRenderer DPR */
  fullResolution?: boolean;
  /** 皮肤名称，默认 "default" */
  skin?: string;
  /** 是否显示底部控制条 */
  showControls?: boolean;
  /** 是否显示半透明黑色遮罩背景 */
  showOverlay?: boolean;
  /** Spine 视口配置（padding 等） */
  viewport?: SpinePlayerConfig["viewport"];
  /** 需要实时追踪坐标的骨骼名称列表，用于 overlay 定位 */
  trackBones?: string[];
  /** 是否开启骨骼调试可视化（红色追踪点） */
  debug?: boolean;
  /** 渲染在骨骼位置上的 overlay 内容（render prop 模式） */
  overlays?: (bones: Record<string, BoneData>) => ReactNode;
  /** 资源加载完成回调 */
  onLoaded?: () => void;
  /** 动画播放完毕回调 */
  onEnd?: (name: string) => void;
  /** 加载失败回调 */
  onError?: (err?: Error) => void;
  children?: (bones: Record<string, BoneData>) => ReactNode;
}

type Props = SpinePlayerProps;

/** 骨骼追踪帧率：30Hz，平衡精度与性能 */
const TRACK_FRAME_INTERVAL = 1000 / 30;

export const SpinePlayer = forwardRef<SpinePlayerHandle, Props>(
  (
    {
      baseUrl,
      name,
      binary = false,
      fullResolution = false,
      skin = "default",
      showControls = false,
      showOverlay = true,
      viewport,
      trackBones,
      debug = false,
      overlays,
      children,
      onLoaded,
      onEnd,
      onError,
    },
    ref,
  ) => {
    // ===== DOM & 实例引用 =====
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<EsotericSpinePlayerInstance | null>(null);

    // ===== 状态标志（使用 ref 避免 re-render，性能优化） =====
    const isLoadedRef = useRef(false); // 资源是否加载完成
    const isRenderingStoppedRef = useRef(true); // 渲染循环是否已停止（初始 true，因为还没创建实例）
    const isTrackingRef = useRef(false); // 骨骼追踪是否运行中
    const frameIdRef = useRef(0); // 骨骼追踪的 rAF ID
    const lastTrackTimeRef = useRef(0); // 上次追踪时间戳（节流用）

    // ===== React 状态（触发 re-render） =====
    const [isVisible, setIsVisible] = useState(false); // 动画是否可见（控制 opacity）
    const [bonePositions, setBonePositions] = useState<Record<string, BoneData>>({}); // 骨骼实时坐标

    // ===== 待播放动画缓存 =====
    // 资源异步加载中，用户提前点击播放时缓存动画名，加载完成后自动播放
    const pendingAnimRef = useRef<{ animName: string; loop?: boolean; trackIndex?: number } | null>(null);

    // ===== 当前播放的 TrackEntry 引用 =====
    // 用于 complete 回调中精确匹配：只有我们 setAnimation 返回的 TrackEntry 才触发 onEnd，
    // 过滤掉切换轨道时旧轨道的误触发 complete 事件
    const currentTrackEntryRef = useRef<TrackEntry | null>(null);

    const onLoadedRef = useRef(onLoaded);
    const onEndRef = useRef(onEnd);
    const onErrorRef = useRef(onError);
    useEffect(() => {
      onLoadedRef.current = onLoaded;
      onEndRef.current = onEnd;
      onErrorRef.current = onError;
    });

    // ==================== 渲染循环管理 ====================
    // 核心性能优化：空闲时停止 WebGL 渲染循环（stopRendering），
    // 仅在播放动画时启动（startRendering），避免后台空跑 rAF 浪费 GPU

    const stopRenderingLoop = useCallback(() => {
      if (playerRef.current && !isRenderingStoppedRef.current) {
        playerRef.current.stopRendering();
        isRenderingStoppedRef.current = true;
      }
    }, []);

    const startRenderingLoop = useCallback(() => {
      if (playerRef.current && isRenderingStoppedRef.current) {
        playerRef.current.startRendering();
        isRenderingStoppedRef.current = false;
      }
    }, []);

    // ==================== 骨骼追踪循环 ====================
    // 通过 rAF 循环读取骨骼世界坐标并转为屏幕像素坐标，
    // 供 overlay（如金币文字）跟随骨骼移动。30Hz 节流降低计算频率。

    const stopTracking = useCallback(() => {
      isTrackingRef.current = false;
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = 0;
      }
    }, []);

    const updateTrackers = useCallback(
      (timestamp: number) => {
        // 组件已卸载或 player 不可用时退出
        if (!isTrackingRef.current || !playerRef.current?.skeleton || !containerRef.current) {
          isTrackingRef.current = false;
          return;
        }

        // 30Hz 节流：未到间隔则跳过计算，只续调度下一帧
        if (lastTrackTimeRef.current && timestamp - lastTrackTimeRef.current < TRACK_FRAME_INTERVAL) {
          frameIdRef.current = requestAnimationFrame(updateTrackers);
          return;
        }
        lastTrackTimeRef.current = timestamp;

        // 读取所有追踪骨骼的屏幕坐标
        const currentPositions: Record<string, BoneData> = {};
        trackBones?.forEach((boneName) => {
          const pos = getBonePixelPos(playerRef.current!, boneName);
          if (pos) {
            currentPositions[boneName] = pos;
          }
        });
        setBonePositions(currentPositions);
        frameIdRef.current = requestAnimationFrame(updateTrackers);
      },
      [trackBones],
    );

    const startTracking = useCallback(() => {
      if (isTrackingRef.current) return;
      if (!trackBones?.length) return;
      isTrackingRef.current = true;
      lastTrackTimeRef.current = 0;
      frameIdRef.current = requestAnimationFrame(updateTrackers);
    }, [trackBones, updateTrackers]);

    // ==================== 页面可见性变化 ====================
    // 切到后台时停止追踪 + 停止渲染，回到前台且动画可见时恢复

    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopTracking();
          stopRenderingLoop();
        } else if (isVisible && playerRef.current) {
          startRenderingLoop();
          if (trackBones?.length) startTracking();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isVisible, trackBones, startRenderingLoop, startTracking, stopRenderingLoop, stopTracking]);

    // ==================== 初始化 Spine Player ====================
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // --- StrictMode 双挂载保护 ---
      // isDisposed 和 instance 为本 effect 闭包私有变量，
      // 确保已卸载实例的异步 success 回调不会覆盖新实例的 playerRef
      let isDisposed = false;
      let instance: EsotericSpinePlayerInstance | null = null;

      // 拼接资源 URL
      const prefix = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      const skelUrl = encodeURI(`${prefix}${name}${binary ? ".skel.bytes" : ".json"}`);
      const atlasUrl = encodeURI(`${prefix}${name}${binary ? ".atlas.txt" : ".atlas"}`);

      // 重置渲染循环状态：新实例创建前，旧状态不得残留
      // 否则 startRenderingLoop 误判"已启动"而跳过 startRendering 调用
      isRenderingStoppedRef.current = false;

      const config: SpinePlayerConfig = {
        skeleton: skelUrl,
        atlas: atlasUrl,
        skin,
        showControls,
        showLoading: false,
        alpha: true,
        backgroundColor: "#00000000",
        debug: {
          bones: debug,
          bounds: false,
          clipping: false,
          hulls: false,
          meshes: false,
          paths: false,
          points: false,
          regions: false,
        },
        preserveDrawingBuffer: false,
        viewport: {
          ...viewport,
          debugRender: debug,
        },

        // ===== 资源加载成功回调 =====
        success: (player) => {
          // StrictMode 下第一次 effect 的 success 可能延迟到 cleanup 后才触发，
          // 此时 isDisposed = true，需要销毁并丢弃这个实例
          if (isDisposed) {
            try {
              player.dispose();
            } catch {
              // 已释放，忽略重复 dispose 异常
            }
            return;
          }

          instance = player;
          playerRef.current = player;
          isLoadedRef.current = true;

          bindSpineRenderLoop(player as unknown as Parameters<typeof bindSpineRenderLoop>[0], 24);

          if (!fullResolution && player.sceneRenderer) {
            const cap = resolveSpineDevicePixelRatio();
            const renderer = player.sceneRenderer as unknown as {
              getSafeDevicePixelRatio: (w: number, h: number) => number;
            };
            const nativeGet = renderer.getSafeDevicePixelRatio.bind(renderer);
            renderer.getSafeDevicePixelRatio = (w: number, h: number) => Math.min(nativeGet(w, h), cap);
          }

          // PNG 纹理非预乘 alpha，禁用 PMA additive batching 避免边缘白色毛刺
          // （v4.1 的 premultipliedAlpha: false 在 v4.3 改为 skeletonRenderer.pmaAdditiveBatching）
          const skeletonRenderer = player.sceneRenderer?.skeletonRenderer;
          if (skeletonRenderer) {
            skeletonRenderer.pmaAdditiveBatching = false;
          }

          // 初始化时暂停渲染，不显示任何动画，等待 playAnimation 调用
          player.paused = true;
          stopRenderingLoop();

          // 绑定动画状态事件
          if (player.animationState) {
            player.animationState.addListener({
              // 动画播放完毕回调
              complete: (entry) => {
                // 精确匹配：只处理我们 setAnimation 返回的 TrackEntry，
                // 过滤掉切换轨道时旧轨道立即触发的 complete 事件
                if (entry !== currentTrackEntryRef.current) return;
                currentTrackEntryRef.current = null;

                const animName = entry.animation?.name ?? "";
                if (!entry.loop && !debug) {
                  setIsVisible(false);
                  player.paused = true;
                  stopTracking();
                  stopRenderingLoop();
                }
                onEndRef.current?.(animName);
              },
              event: (_entry, _evt) => {
                // 自定义帧事件暂不处理，可扩展
              },
            });
          }

          onLoadedRef.current?.();

          // 如果加载前用户已点击播放（pendingAnimRef 有缓存），立即播放
          const pending = pendingAnimRef.current;
          if (pending) {
            pendingAnimRef.current = null;
            setIsVisible(true);
            const trackEntry = player.animationState?.setAnimation(
              pending.trackIndex || 0,
              pending.animName,
              pending.loop ?? false,
            );
            currentTrackEntryRef.current = trackEntry ?? null;
            startRenderingLoop();
            player.paused = false;
            startTracking();
          }
        },

        // ===== 资源加载失败回调 =====
        error: (_player, msg) => {
          console.error("[SpinePlayer] 加载失败:", msg);
          onErrorRef.current?.(new Error(msg));
        },
      };

      instance = new EsotericSpinePlayer(container, config);

      // ===== cleanup：组件卸载或 StrictMode 重挂载时清理 =====
      return () => {
        isDisposed = true;
        stopTracking();
        if (instance) {
          try {
            instance.paused = true;
            if (!isRenderingStoppedRef.current) {
              instance.stopRendering();
            }
            instance.dispose();
          } catch (e) {
            console.error("[SpinePlayer] dispose error:", e);
          } finally {
            // 只在当前实例仍指向自己时清理（防止 StrictMode 下新实例被误清）
            if (playerRef.current === instance) {
              playerRef.current = null;
              isLoadedRef.current = false;
            }
          }
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ==================== 暴露命令式接口 ====================
    useImperativeHandle(
      ref,
      () => ({
        /**
         * 播放动画
         * @param animName 动画名称
         * @param loop 是否循环，默认 false
         * @param trackIndex 轨道索引，默认 0
         */
        playAnimation(animName: string, loop?: boolean, trackIndex?: number) {
          const player = playerRef.current;

          // 资源尚未加载完成：缓存动画，等 success 回调自动播放
          if (!player?.animationState || !isLoadedRef.current) {
            pendingAnimRef.current = { animName, loop, trackIndex };
            return;
          }

          const shouldLoop = loop ?? false;
          try {
            setIsVisible(true);
            // setAnimation 返回 TrackEntry，存入 ref 用于 complete 回调精确匹配
            const trackEntry = player.animationState.setAnimation(trackIndex || 0, animName, shouldLoop);
            currentTrackEntryRef.current = trackEntry;
            startRenderingLoop();
            player.paused = false;
            startTracking();
          } catch (e) {
            console.error(`[SpinePlayer] 无法播放动画 ${animName}:`, e);
            onErrorRef.current?.(new Error(`无法播放动画 ${animName}`));
          }
        },

        /** 切换皮肤 */
        setSkin(skinName: string) {
          const player = playerRef.current;
          if (!player?.skeleton) return;
          const skeleton = player.skeleton as unknown as {
            setSkinByName: (name: string) => void;
            setSlotsToSetupPose: () => void;
            setToSetupPose: () => void;
          };
          skeleton.setSkinByName(skinName);
          skeleton.setSlotsToSetupPose();
          skeleton.setToSetupPose();
        },

        getAnimations() {
          const player = playerRef.current;
          if (!player?.skeleton) return [];
          return player.skeleton.data.animations.map((a) => a.name);
        },
      }),
      [startRenderingLoop, startTracking, onEnd, onError],
    );

    // ==================== 渲染 ====================
    return (
      <div
        className="spine-player-wrapper"
        style={{
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? "auto" : "none",
          backgroundColor: showOverlay ? "rgba(0, 0, 0, 0.5)" : "transparent",
        }}
      >
        {/* Spine WebGL 渲染容器 */}
        <div ref={containerRef} className="spine-player-container" />

        {/* overlay 层：骨骼追踪可视化 + 自定义覆盖内容 */}
        <div className="spine-player-overlay">
          {/* 调试模式：骨骼追踪点（红点 + 名称） */}
          {debug &&
            Object.entries(bonePositions).map(([boneName, pos]) => (
              <div
                key={`debug-${boneName}`}
                className="spine-debug-dot"
                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
              >
                <span className="spine-debug-label">{boneName}</span>
              </div>
            ))}
          {/* 自定义 overlay 内容（如金币文字跟随骨骼） */}
          {overlays?.(bonePositions)}
          {children?.(bonePositions)}
        </div>
      </div>
    );
  },
);

SpinePlayer.displayName = "SpinePlayer";
