import { useLayoutEffect, useRef, useState } from "react";
import tipsIcon from "@/assets/images/icon-tips.png";
import { subscribeRem } from "@/utils/rem";
import { LOBBY_TIPS_DEFAULT } from "./constants.ts";
import type { LobbyTipsBarProps } from "./types.ts";
import "./index.scss";

function checkOverflow(viewport: HTMLElement, measure: HTMLElement): boolean {
  const vw = Math.floor(viewport.clientWidth);
  const tw = Math.ceil(measure.getBoundingClientRect().width);
  if (vw <= 0 || tw <= 0) return false;
  return tw > vw;
}

/** Banner 下方左侧公告条（图标 + 横向滚动文案） */
export function LobbyTipsBar({ message = LOBBY_TIPS_DEFAULT }: LobbyTipsBarProps) {
  const display = message.trim() || LOBBY_TIPS_DEFAULT;
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) return;

    const run = () => {
      setShouldScroll(checkOverflow(viewport, measure));
    };

    run();

    const observer = new ResizeObserver(run);
    observer.observe(viewport);

    const offRem = subscribeRem(run);

    return () => {
      observer.disconnect();
      offRem();
    };
  }, [display]);

  return (
    <div className="lobby-tips" role="note" aria-live="polite">
      <img className="lobby-tips__icon" src={tipsIcon} alt="" aria-hidden />
      <div ref={viewportRef} className="lobby-tips__viewport">
        <span ref={measureRef} className="lobby-tips__measure" aria-hidden>
          {display}
        </span>
        <div
          className={`lobby-tips__marquee${shouldScroll ? " is-scrolling" : ""}`}
        >
          <span className="lobby-tips__text">{display}</span>
          {shouldScroll ? (
            <span className="lobby-tips__text" aria-hidden>
              {display}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}