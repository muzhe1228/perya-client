import type { CSSProperties, MutableRefObject, ReactNode, RefObject } from "react";
import { useCallback } from "react";
import { pxToRem } from "@/utils/rem";
import "./index.scss";

interface InfiniteListProps {
  loading: boolean;
  hasMore: boolean;
  empty: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
  children: ReactNode;
  loadingNode?: ReactNode;
  emptyNode?: ReactNode;
  endNode?: ReactNode;
  className?: string;
  gap?: number | string;
  showScrollbar?: boolean;
  /** 与 useInfiniteScroll 的 scrollRootRef 指向同一滚动容器 */
  rootRef?: RefObject<HTMLDivElement | null> | MutableRefObject<HTMLDivElement | null>;
}

export function InfiniteList({
  loading,
  hasMore,
  empty,
  sentinelRef,
  children,
  loadingNode = "加载中…",
  emptyNode = "暂无数据",
  endNode = "— 到底了 —",
  className = "",
  gap = 6,
  showScrollbar = false,
  rootRef,
}: InfiniteListProps) {
  const gapValue = gap != null ? (typeof gap === "number" ? pxToRem(gap) : gap) : undefined;
  const listStyle: CSSProperties | undefined = gapValue
    ? { display: "flex", flexDirection: "column", gap: gapValue }
    : undefined;

  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      if (rootRef) (rootRef as MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [rootRef],
  );

  return (
    <div
      ref={setRoot}
      className={`il-root${showScrollbar ? " is-show-scrollbar" : ""}${className ? ` ${className}` : ""}`}
    >
      {gapValue ? (
        <div className="il-list" style={listStyle}>
          {children}
        </div>
      ) : (
        children
      )}

      {loading && <div className="il-footer">{loadingNode}</div>}
      {!loading && empty && <div className="il-footer">{emptyNode}</div>}
      {!loading && !empty && !hasMore && <div className="il-footer is-end">{endNode}</div>}

      {hasMore && !empty && <div className="il-sentinel" ref={sentinelRef} />}
    </div>
  );
}
