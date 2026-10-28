import { useRef, useState } from "react";

const DRAG_THRESHOLD = 40;

// A 400 px side panel on desktop; on phones a bottom sheet at 60% height that
// drags (or taps) open to full height.
export function PanelFrame({ children }) {
  const [expanded, setExpanded] = useState(false);
  const dragStart = useRef(null);
  const onPointerUp = (event) => {
    if (dragStart.current === null) return;
    const moved = event.clientY - dragStart.current;
    dragStart.current = null;
    if (moved < -DRAG_THRESHOLD) setExpanded(true);
    if (moved > DRAG_THRESHOLD) setExpanded(false);
  };
  return (
    <aside
      className={`fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl border-t border-neutral-800 bg-neutral-950/95 shadow-2xl backdrop-blur transition-[height] duration-200 motion-reduce:transition-none md:inset-x-auto md:right-0 md:top-0 md:h-dvh md:w-[400px] md:rounded-none md:border-l md:border-t-0 ${expanded ? "h-[calc(100dvh-3.5rem)]" : "h-[60dvh]"}`}>
      <button type="button" aria-label={expanded ? "Collapse panel" : "Expand panel"} aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        onPointerDown={(event) => { dragStart.current = event.clientY; }}
        onPointerUp={onPointerUp}
        className="mx-auto flex h-6 w-full touch-none items-center justify-center md:hidden">
        <span className="h-1.5 w-12 rounded-full bg-neutral-600" />
      </button>
      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  );
}
