import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface UseMeasuredVirtualListOptions {
  containerRef: RefObject<HTMLElement | null>;
  itemCount: number;
  estimateSize: (index: number) => number;
  overscan?: number;
  enabled?: boolean;
  cacheKey?: string | number | null;
}

interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

function findStartIndex(offsets: number[], scrollTop: number) {
  let low = 0;
  let high = offsets.length - 1;
  let result = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (offsets[mid] <= scrollTop) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

export function useMeasuredVirtualList({
  containerRef,
  itemCount,
  estimateSize,
  overscan = 6,
  enabled = true,
  cacheKey = null,
}: UseMeasuredVirtualListOptions) {
  const sizeMapRef = useRef(new Map<number, number>());
  const observerMapRef = useRef(new Map<number, ResizeObserver>());
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [, setMeasurementVersion] = useState(0);

  const getItemSize = useCallback(
    (index: number) => sizeMapRef.current.get(index) ?? estimateSize(index),
    [estimateSize],
  );

  const { offsets, totalSize } = useMemo(() => {
    const nextOffsets: number[] = new Array(itemCount);
    let runningOffset = 0;

    for (let index = 0; index < itemCount; index += 1) {
      nextOffsets[index] = runningOffset;
      runningOffset += getItemSize(index);
    }

    return {
      offsets: nextOffsets,
      totalSize: runningOffset,
    };
  }, [getItemSize, itemCount]);

  const virtualItems = useMemo(() => {
    if (!enabled || itemCount === 0) {
      return offsets.map((start, index) => ({
        index,
        start,
        size: getItemSize(index),
      }));
    }

    const safeViewportHeight = Math.max(viewportHeight, 1);
    const startIndex = findStartIndex(offsets, Math.max(scrollTop, 0));
    let endIndex = startIndex;
    const viewportBottom = scrollTop + safeViewportHeight;

    while (
      endIndex < itemCount - 1 &&
      offsets[endIndex] + getItemSize(endIndex) < viewportBottom
    ) {
      endIndex += 1;
    }

    const sliceStart = Math.max(0, startIndex - overscan);
    const sliceEnd = Math.min(itemCount - 1, endIndex + overscan);
    const items: VirtualItem[] = [];

    for (let index = sliceStart; index <= sliceEnd; index += 1) {
      items.push({
        index,
        start: offsets[index],
        size: getItemSize(index),
      });
    }

    return items;
  }, [
    enabled,
    getItemSize,
    itemCount,
    offsets,
    overscan,
    scrollTop,
    viewportHeight,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const syncViewport = () => {
      setScrollTop(container.scrollTop);
      setViewportHeight(container.clientHeight);
    };

    syncViewport();
  }, [containerRef, itemCount]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const syncViewport = () => {
      setScrollTop(container.scrollTop);
      setViewportHeight(container.clientHeight);
    };

    syncViewport();
    container.addEventListener("scroll", syncViewport, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            syncViewport();
          })
        : null;

    resizeObserver?.observe(container);

    return () => {
      container.removeEventListener("scroll", syncViewport);
      resizeObserver?.disconnect();
    };
  }, [containerRef]);

  useEffect(() => {
    const observerMap = observerMapRef.current;

    return () => {
      observerMap.forEach((observer) => observer.disconnect());
      observerMap.clear();
    };
  }, []);

  useLayoutEffect(() => {
    observerMapRef.current.forEach((observer) => observer.disconnect());
    observerMapRef.current.clear();
    sizeMapRef.current.clear();
    setMeasurementVersion((value) => value + 1);
  }, [cacheKey]);

  const measureElement = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      const existingObserver = observerMapRef.current.get(index);
      existingObserver?.disconnect();
      observerMapRef.current.delete(index);

      if (!node) {
        return;
      }

      const updateSize = () => {
        const nextSize = Math.ceil(node.getBoundingClientRect().height);
        const currentSize = sizeMapRef.current.get(index);

        if (currentSize === nextSize || nextSize <= 0) {
          return;
        }

        sizeMapRef.current.set(index, nextSize);
        setMeasurementVersion((value) => value + 1);
      };

      updateSize();

      if (typeof ResizeObserver === "undefined") {
        return;
      }

      const observer = new ResizeObserver(() => {
        updateSize();
      });

      observer.observe(node);
      observerMapRef.current.set(index, observer);
    },
    [],
  );

  const getOffsetForIndex = useCallback(
    (index: number) => offsets[index] ?? 0,
    [offsets],
  );

  return {
    virtualItems,
    totalSize,
    measureElement,
    getOffsetForIndex,
  };
}
