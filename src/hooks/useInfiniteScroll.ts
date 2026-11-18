import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/** 分页 total 有时为字符串，归一化后用于 hasMore 判断 */
export function normalizePageTotal(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * 通用无限滚动（分页加载）hook（与 masskara-client 同实现）。
 */
export function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 10,
  deps = [],
  onError,
  scrollRootRef,
}: {
  fetchFn: (page: number, size: number) => Promise<{ items: T[]; total?: number; hasMore?: boolean | null }>;
  pageSize?: number;
  deps?: React.DependencyList;
  onError?: (error: unknown) => void;
  scrollRootRef?: RefObject<HTMLElement | null>;
}): {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
  reset: () => void;
} {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(1);
  const countRef = useRef(0);
  const loadingRef = useRef(false);
  const loadGenRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLDivElement | null>(null);
  const hasMoreRef = useRef(true);
  const prevDepsRef = useRef<React.DependencyList | null>(null);
  const inflightFirstPageRef = useRef<{ promise: Promise<unknown> } | null>(null);
  const postLoadFlushRef = useRef<() => void>(() => {});

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const resolveHasMore = (
    res: { items?: T[]; total?: unknown; hasMore?: boolean | null },
    pageItems: T[],
    loaded: number,
  ): boolean => {
    if (typeof res.hasMore === "boolean") return res.hasMore;
    const total = normalizePageTotal(res.total);
    if (total != null) return loaded < total;
    return pageItems.length >= pageSize;
  };

  const fetchPage = useCallback(
    async (page: number, replace: boolean) => {
      if (loadingRef.current) return;
      const gen = loadGenRef.current;
      loadingRef.current = true;
      setLoading(true);
      try {
        const res = await fetchFn(page, pageSize);
        if (gen !== loadGenRef.current) return;
        const pageItems = res.items ?? [];
        const loaded = replace ? pageItems.length : countRef.current + pageItems.length;
        countRef.current = loaded;
        setItems((prev) => (replace ? pageItems : [...prev, ...pageItems]));
        const nextHasMore = resolveHasMore(res, pageItems, loaded);
        hasMoreRef.current = nextHasMore;
        setHasMore(nextHasMore);
      } catch (e) {
        if (gen !== loadGenRef.current) return;
        pageRef.current = Math.max(0, page - 1);
        onError?.(e);
      } finally {
        if (gen !== loadGenRef.current) return;
        setLoading(false);
        loadingRef.current = false;
        window.requestAnimationFrame(() => {
          postLoadFlushRef.current();
        });
      }
    },
    [fetchFn, pageSize, onError],
  );

  useEffect(() => {
    const prev = prevDepsRef.current;
    const sameDeps =
      prev != null && prev.length === deps.length && prev.every((d, i) => Object.is(d, deps[i]));
    prevDepsRef.current = deps;
    if (sameDeps && inflightFirstPageRef.current) return;

    loadGenRef.current += 1;
    loadingRef.current = false;
    pageRef.current = 1;
    countRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    setItems([]);
    setLoading(false);
    const entry: { promise: Promise<unknown> } = { promise: Promise.resolve() };
    entry.promise = fetchPage(1, true).finally(() => {
      if (inflightFirstPageRef.current === entry) inflightFirstPageRef.current = null;
    });
    inflightFirstPageRef.current = entry;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMoreInner = useCallback(() => {
    if (!hasMoreRef.current || loadingRef.current) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    void fetchPage(nextPage, false);
  }, [fetchPage]);

  const tryLoadMoreIfSentinelVisible = useCallback(() => {
    const node = sentinelNodeRef.current;
    if (!node || !hasMoreRef.current || loadingRef.current) return;
    const root = scrollRootRef?.current ?? null;
    const margin = 200;
    const rect = node.getBoundingClientRect();
    if (root) {
      const rootRect = root.getBoundingClientRect();
      if (rect.top <= rootRect.bottom + margin && rect.bottom >= rootRect.top - margin) {
        loadMoreInner();
      }
    } else if (rect.top <= window.innerHeight + margin && rect.bottom >= -margin) {
      loadMoreInner();
    }
  }, [scrollRootRef, loadMoreInner]);

  const loadMore = useCallback(() => {
    loadMoreInner();
  }, [loadMoreInner]);

  useEffect(() => {
    postLoadFlushRef.current = tryLoadMoreIfSentinelVisible;
  }, [tryLoadMoreIfSentinelVisible]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      sentinelNodeRef.current = node;
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;
      const root = scrollRootRef?.current ?? null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) loadMore();
        },
        { root, rootMargin: "200px", threshold: 0 },
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [loadMore, scrollRootRef],
  );

  const reset = useCallback(() => {
    loadGenRef.current += 1;
    loadingRef.current = false;
    pageRef.current = 1;
    countRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    setItems([]);
    setLoading(false);
    fetchPage(1, true);
  }, [fetchPage]);

  return { items, loading, hasMore, sentinelRef, reset };
}
