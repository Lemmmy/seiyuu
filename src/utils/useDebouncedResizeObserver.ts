import { useState, useMemo, RefObject, RefCallback } from "react";
import useResizeObserver from "use-resize-observer";
import { debounce } from "lodash-es";

type ObservedSize = {
  width?: number;
  height?: number;
};
type ResizeHandler = (size: ObservedSize) => void;
type HookResponse<T extends HTMLElement> = {
  ref: RefCallback<T>;
} & ObservedSize;
type RoundingFunction = (n: number) => number;

export function useDebouncedResizeObserver<T extends HTMLElement>(duration: number, opts?: {
  ref?: RefObject<T> | T | null | undefined;
  onResize?: ResizeHandler;
  box?: ResizeObserverBoxOptions;
  round?: RoundingFunction;
}): HookResponse<T> {
  const [size, setSize] = useState<ObservedSize>({});
  const onResize = useMemo(() => debounce(setSize, duration, { leading: true }), [duration]);
  const { ref } = useResizeObserver({ onResize });

  return { ref, ...size };
};
