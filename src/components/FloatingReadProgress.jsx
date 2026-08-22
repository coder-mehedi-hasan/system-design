import { useEffect, useRef, useState } from "react";

const FAB_POSITION_KEY = "fab-position";
const FAB_SIZE = 56;
const EDGE_MARGIN = 8;
const DRAG_THRESHOLD = 5;

function clampPosition(x, y) {
  const maxX = Math.max(EDGE_MARGIN, window.innerWidth - FAB_SIZE - EDGE_MARGIN);
  const maxY = Math.max(EDGE_MARGIN, window.innerHeight - FAB_SIZE - EDGE_MARGIN);
  return {
    x: Math.min(Math.max(x, EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, EDGE_MARGIN), maxY),
  };
}

function getDefaultPosition() {
  return {
    x: window.innerWidth - FAB_SIZE - 18,
    y: window.innerHeight - FAB_SIZE - 88,
  };
}

function loadStoredPosition() {
  try {
    const raw = localStorage.getItem(FAB_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) return null;
    return clampPosition(parsed.x, parsed.y);
  } catch {
    return null;
  }
}

function readPercent() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 100;
  const pct = (window.scrollY / max) * 100;
  return Math.min(100, Math.max(0, pct));
}

// Draggable floating button showing current-chapter reading progress.
// Tap toggles "mark as read"; drag repositions it anywhere on screen.
// Progress is tracked internally (rAF-throttled) to avoid re-rendering
// the rest of the app on every scroll event.
export default function FloatingReadProgress({
  visible,
  chapterKey,
  isActiveRead,
  onToggleRead,
}) {
  const [position, setPosition] = useState(() =>
    loadStoredPosition() || getDefaultPosition()
  );
  const [percent, setPercent] = useState(() => readPercent());
  const dragRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setPosition(clampPosition(drag.originX + dx, drag.originY + dy));
  };

  const endDrag = (e) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    if (drag.moved) {
      setPosition((pos) => {
        try {
          localStorage.setItem(FAB_POSITION_KEY, JSON.stringify(pos));
        } catch {
          // best effort
        }
        return pos;
      });
    } else {
      onToggleRead();
    }
  };

  // Keep the button inside the viewport across resizes / orientation changes.
  useEffect(() => {
    const onResize = () => setPosition((pos) => clampPosition(pos.x, pos.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Track chapter scroll progress. Re-measures a few frames after a chapter
  // swap since content (and page height) renders asynchronously.
  useEffect(() => {
    let frame = null;
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        setPercent(readPercent());
      });
    };

    scheduleUpdate();
    const settleTimers = [60, 200, 500].map((delay) =>
      window.setTimeout(scheduleUpdate, delay)
    );

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      settleTimers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [chapterKey]);

  if (!visible) return null;

  const clampedPercent = Math.min(100, Math.max(0, Math.round(percent)));
  const RADIUS = 23;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const ringColor = isActiveRead ? "#22a06b" : "var(--accent)";

  return (
    <button
      type="button"
      aria-label={`${isActiveRead ? "Mark as unread" : "Mark as read"} · ${clampedPercent}% of chapter read`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        left: position.x,
        top: position.y,
        width: FAB_SIZE,
        height: FAB_SIZE,
        touchAction: "none",
      }}
      className="fixed z-[18] flex cursor-pointer select-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] shadow-[0_4px_14px_rgba(0,0,0,0.12)] active:scale-95"
    >
      <svg
        width={FAB_SIZE}
        height={FAB_SIZE}
        viewBox={`0 0 ${FAB_SIZE} ${FAB_SIZE}`}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={FAB_SIZE / 2}
          cy={FAB_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth="3"
        />
        <circle
          cx={FAB_SIZE / 2}
          cy={FAB_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clampedPercent / 100)}
        />
      </svg>
      <span
        className="text-[11px] font-semibold leading-none"
        style={{ color: isActiveRead ? "#12734b" : "var(--accent)" }}
      >
        {clampedPercent}%
      </span>
    </button>
  );
}
