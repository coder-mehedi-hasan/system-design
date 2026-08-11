import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ChapterView from "./components/ChapterView.jsx";
import { renderMarkdown } from "./lib/markdown.js";
import {
  getReadSlugs,
  setChapterRead,
  getLastReadingSlug,
  setLastReadingSlug,
  getChapterReadingPosition,
  setChapterReadingPosition,
  SIDEBAR_STORAGE_KEY,
} from "./lib/storage.js";

const MOBILE_QUERY = "(max-width: 860px)";

export default function App() {
  const [chapters, setChapters] = useState([]);
  const [activeSlug, setActiveSlug] = useState(null);
  const [content, setContent] = useState({ status: "empty", html: "", errorMessage: "" });
  const [readSlugs, setReadSlugs] = useState(() => getReadSlugs());
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) return stored === "1";
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  const activeSlugRef = useRef(null);
  activeSlugRef.current = activeSlug;
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;
  const bootstrappedRef = useRef(false);

  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  const setSidebarCollapsed = useCallback((value) => {
    setCollapsed(value);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? "1" : "0");
  }, []);

  const saveActiveReadingPosition = useCallback(() => {
    if (activeSlugRef.current) {
      setChapterReadingPosition(activeSlugRef.current, window.scrollY);
    }
  }, []);

  const restoreChapterReadingPosition = useCallback((slug, targetY) => {
    if (!Number.isFinite(targetY) || targetY < 0) return;
    const desiredY = Math.round(targetY);
    let attempts = 0;
    const maxAttempts = 10;

    const applyRestore = () => {
      if (activeSlugRef.current !== slug) return;
      const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: Math.min(desiredY, maxScrollY) });
      attempts += 1;
      if (attempts >= maxAttempts) return;
      window.setTimeout(() => window.requestAnimationFrame(applyRestore), 120);
    };

    window.requestAnimationFrame(applyRestore);
  }, []);

  const selectChapter = useCallback(
    async (slug, options = {}) => {
      saveActiveReadingPosition();
      setActiveSlug(slug);

      if (chaptersRef.current.some((ch) => ch.slug === slug)) {
        setLastReadingSlug(slug);
      }

      setContent({ status: "loading", html: "", errorMessage: "" });

      try {
        const res = await fetch(`/beginner/${slug}.md`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const md = await res.text();
        setContent({ status: "ready", html: renderMarkdown(md), errorMessage: "" });

        const savedScrollY = Number.isFinite(options.scrollY)
          ? options.scrollY
          : getChapterReadingPosition(slug);
        if (options.restorePosition) {
          restoreChapterReadingPosition(slug, savedScrollY);
        } else {
          window.scrollTo({ top: 0 });
        }
      } catch (err) {
        setContent({
          status: "error",
          html: "",
          errorMessage: `Could not load "${slug}.md" — ${err.message}. Make sure the app is served over HTTP.`,
        });
      }

      if (isMobile()) setSidebarCollapsed(true);
    },
    [saveActiveReadingPosition, restoreChapterReadingPosition, setSidebarCollapsed]
  );

  // Load the chapter list, then run the initial resume flow once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/chapters.json");
      const list = await res.json();
      if (cancelled) return;
      setChapters(list);
      chaptersRef.current = list;

      if (bootstrappedRef.current) return;
      bootstrappedRef.current = true;

      const params = new URLSearchParams(location.search);
      const requestedSlug = params.get("chapter");
      const firstSlug = list[0]?.slug;
      const hasChapter = (slug) => !!slug && list.some((ch) => ch.slug === slug);
      const lastReadingSlug = getLastReadingSlug();

      if (hasChapter(requestedSlug)) {
        selectChapter(requestedSlug);
        return;
      }

      if (hasChapter(lastReadingSlug) && lastReadingSlug !== firstSlug) {
        if (window.confirm("Do you want to resume your reading?")) {
          const scrollY = getChapterReadingPosition(lastReadingSlug);
          selectChapter(lastReadingSlug, { restorePosition: true, scrollY });
          return;
        }
      }

      if (firstSlug) selectChapter(firstSlug);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectChapter]);

  // Persist reading position on scroll, unload, and tab hide.
  useEffect(() => {
    let timer = null;
    const scheduleSave = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        saveActiveReadingPosition();
        timer = null;
      }, 150);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") saveActiveReadingPosition();
    };

    window.addEventListener("scroll", scheduleSave, { passive: true });
    window.addEventListener("beforeunload", saveActiveReadingPosition);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener("scroll", scheduleSave);
      window.removeEventListener("beforeunload", saveActiveReadingPosition);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [saveActiveReadingPosition]);

  const toggleRead = () => {
    if (!activeSlug) return;
    const next = setChapterRead(activeSlug, !readSlugs.has(activeSlug));
    setReadSlugs(new Set(next));
  };

  const goToOffset = (offset) => {
    const idx = chapters.findIndex((ch) => ch.slug === activeSlug);
    const target = idx + offset;
    if (target >= 0 && target < chapters.length) {
      selectChapter(chapters[target].slug);
    }
  };

  const chapterIndex = chapters.findIndex((ch) => ch.slug === activeSlug);

  return (
    <>
      <button
        type="button"
        aria-label="Toggle sidebar"
        aria-expanded={!collapsed}
        onClick={() => setSidebarCollapsed(!collapsed)}
        className="fixed left-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--sidebar-bg)] hover:text-[var(--text)]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="2" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <line x1="6" y1="2.5" x2="6" y2="13.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>

      <div className="flex min-h-screen">
        <div
          onClick={() => setSidebarCollapsed(true)}
          className={`fixed inset-0 z-20 bg-[rgba(15,15,20,0.35)] transition-opacity duration-200 md:hidden ${
            collapsed ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        />

        <Sidebar
          chapters={chapters}
          activeSlug={activeSlug}
          readSlugs={readSlugs}
          collapsed={collapsed}
          onSelect={selectChapter}
        />

        <ChapterView
          html={content.html}
          status={content.status}
          errorMessage={content.errorMessage}
          chapterIndex={chapterIndex}
          totalChapters={chapters.length}
          readCount={readSlugs.size}
          isActiveRead={!!activeSlug && readSlugs.has(activeSlug)}
          onToggleRead={toggleRead}
          onPrev={() => goToOffset(-1)}
          onNext={() => goToOffset(1)}
        />
      </div>
    </>
  );
}
