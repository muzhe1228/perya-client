import { useCallback, useEffect, useRef, useState } from "react";
import bannerImg from "@/assets/images/banner.png";
import { BANNER_SLIDES } from "@/data/lobbyData";
import { useLobbyStore } from "@/stores/useLobbyStore";
import {
  BANNER_AUTOPLAY_MS,
  BANNER_FLICK_MIN_PX,
  BANNER_FLICK_VELOCITY,
  BANNER_SWIPE_MIN_PX,
  BANNER_SWIPE_RATIO,
} from "./constants.ts";
import "./index.scss";

export function LobbyBanner() {
  const bannerIndex = useLobbyStore((s) => s.bannerIndex);
  const setBannerIndex = useLobbyStore((s) => s.setBannerIndex);
  const count: number = BANNER_SLIDES.length;

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
  });
  const dragOffsetRef = useRef(0);
  const draggingRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionOn, setTransitionOn] = useState(true);

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      const next = ((index % count) + count) % count;
      setBannerIndex(next);
    },
    [count, setBannerIndex],
  );

  const getSwipeThreshold = useCallback(() => {
    const w = viewportRef.current?.clientWidth ?? 0;
    return Math.max(BANNER_SWIPE_MIN_PX, w * BANNER_SWIPE_RATIO);
  }, []);

  const dampEdgeOffset = useCallback(
    (raw: number, index: number) => {
      if (count <= 1) return 0;
      if (index <= 0 && raw > 0) return raw * 0.32;
      if (index >= count - 1 && raw < 0) return raw * 0.32;
      return raw;
    },
    [count],
  );

  const endDrag = useCallback(() => {
    draggingRef.current = false;
    dragRef.current.pointerId = -1;
    setIsDragging(false);
  }, []);

  const finishDrag = useCallback(
    (offset: number, velocity: number) => {
      const index = useLobbyStore.getState().bannerIndex;
      const threshold = getSwipeThreshold();
      const flick =
        Math.abs(velocity) >= BANNER_FLICK_VELOCITY &&
        Math.abs(offset) >= BANNER_FLICK_MIN_PX;

      let delta = 0;
      if (offset < -threshold || (flick && velocity < 0)) delta = 1;
      else if (offset > threshold || (flick && velocity > 0)) delta = -1;

      endDrag();
      setTransitionOn(true);

      requestAnimationFrame(() => {
        dragOffsetRef.current = 0;
        setDragOffset(0);
        if (delta !== 0) goTo(index + delta);
      });
    },
    [endDrag, getSwipeThreshold, goTo],
  );

  const onWindowPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current || e.pointerId !== dragRef.current.pointerId) {
        return;
      }
      const now = performance.now();
      const x = e.clientX;
      const dt = now - dragRef.current.lastT;
      if (dt > 0) {
        dragRef.current.velocity = (x - dragRef.current.lastX) / dt;
      }
      dragRef.current.lastX = x;
      dragRef.current.lastT = now;

      const index = useLobbyStore.getState().bannerIndex;
      const raw = x - dragRef.current.startX;
      const offset = dampEdgeOffset(raw, index);
      dragOffsetRef.current = offset;
      setDragOffset(offset);
    },
    [dampEdgeOffset],
  );

  const onWindowPointerUp = useCallback(
    (e: PointerEvent) => {
      if (e.pointerId !== dragRef.current.pointerId) return;
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerUp);
      viewportRef.current?.releasePointerCapture(e.pointerId);
      finishDrag(dragOffsetRef.current, dragRef.current.velocity);
    },
    [finishDrag, onWindowPointerMove],
  );

  // 自动轮播：拖动中 / 页面隐藏时暂停
  useEffect(() => {
    if (count <= 1 || isDragging) return;

    let timer: number | undefined;

    const schedule = () => {
      timer = window.setTimeout(() => {
        const i = useLobbyStore.getState().bannerIndex;
        goTo(i + 1);
      }, BANNER_AUTOPLAY_MS);
    };

    const onVisibility = () => {
      if (timer) clearTimeout(timer);
      if (document.visibilityState === "visible") schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [bannerIndex, count, goTo, isDragging]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (count <= 1) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;

    const now = performance.now();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      lastT: now,
      velocity: 0,
    };
    draggingRef.current = true;
    dragOffsetRef.current = 0;
    setTransitionOn(false);
    setIsDragging(true);
    setDragOffset(0);

    viewportRef.current?.setPointerCapture(e.pointerId);
    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerUp);
  };

  const translate = `calc(-${bannerIndex * 100}% + ${dragOffset}px)`;

  return (
    <div className="lobby-banner">
      <div
        ref={viewportRef}
        className={`lobby-banner__viewport${isDragging ? " is-dragging" : ""}`}
        onPointerDown={onPointerDown}
      >
        <div
          ref={trackRef}
          className="lobby-banner__track"
          style={{
            transform: `translate3d(${translate}, 0, 0)`,
            transition: transitionOn ? "transform 0.28s ease-out" : "none",
          }}
        >
          {BANNER_SLIDES.map((slide) => (
            <article key={slide.id} className="lobby-banner__slide">
              <img
                className="lobby-banner__img"
                src={bannerImg}
                alt={slide.title}
                draggable={false}
              />
            </article>
          ))}
        </div>
      </div>
      {count > 1 ? (
        <div className="lobby-banner__dots">
          {BANNER_SLIDES.map((b, i) => (
            <button
              key={b.id}
              type="button"
              className={i === bannerIndex ? "is-active" : ""}
              aria-label={`Banner ${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
