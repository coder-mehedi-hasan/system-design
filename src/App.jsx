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

// Hash-based routes mirror the content layout:
//   "#/"                  → course picker
//   "#/system-design"     → course, first chapter auto-selected
//   "#/system-design/foo" → a specific chapter
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [course, chapter] = raw.split("/");
  return { course: course || null, chapter: chapter || null };
}

export default function App() {
  const [courses, setCourses] = useState([]);
  const [chaptersByCourse, setChaptersByCourse] = useState({});
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeSlug, setActiveSlug] = useState(null);
  const [content, setContent] = useState({
    status: "courses",
    html: "",
    errorMessage: "",
  });
  const [readByCourse, setReadByCourse] = useState({});
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) return stored === "1";
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  const coursesRef = useRef(courses);
  coursesRef.current = courses;
  const chaptersByCourseRef = useRef(chaptersByCourse);
  chaptersByCourseRef.current = chaptersByCourse;
  const activeCourseIdRef = useRef(null);
  activeCourseIdRef.current = activeCourseId;
  const activeSlugRef = useRef(null);
  activeSlugRef.current = activeSlug;
  const bootstrappedRef = useRef(false);
  const requestIdRef = useRef(0);

  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  const setSidebarCollapsed = useCallback((value) => {
    setCollapsed(value);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? "1" : "0");
  }, []);

  const saveActiveReadingPosition = useCallback(() => {
    const courseId = activeCourseIdRef.current;
    const slug = activeSlugRef.current;
    if (courseId && slug) {
      setChapterReadingPosition(courseId, slug, window.scrollY);
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
    async (courseId, slug, options = {}) => {
      saveActiveReadingPosition();

      const chapters = chaptersByCourseRef.current[courseId] || [];
      const isKnown = !!slug && chapters.some((ch) => ch.slug === slug);
      setActiveCourseId(courseId);
      setActiveSlug(isKnown ? slug : null);

      if (!isKnown) {
        setContent({ status: "course-empty", html: "", errorMessage: "" });
        window.scrollTo({ top: 0 });
        return;
      }

      setLastReadingSlug(courseId, slug);
      const myId = ++requestIdRef.current;
      setContent({ status: "loading", html: "", errorMessage: "" });

      try {
        const res = await fetch(`/${courseId}/beginner/${slug}.md`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const md = await res.text();
        if (requestIdRef.current !== myId) return;
        setContent({ status: "ready", html: renderMarkdown(md), errorMessage: "" });

        const savedScrollY = Number.isFinite(options.scrollY)
          ? options.scrollY
          : getChapterReadingPosition(courseId, slug);
        if (options.restorePosition) {
          restoreChapterReadingPosition(slug, savedScrollY);
        } else {
          window.scrollTo({ top: 0 });
        }
      } catch (err) {
        if (requestIdRef.current !== myId) return;
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

  const navigateToChapter = useCallback((courseId, slug) => {
    window.location.hash = `/${courseId}/${slug}`;
  }, []);

  // Reacts to hash changes (back/forward, sidebar clicks, deep links).
  const handleRoute = useCallback(() => {
    const { course, chapter } = parseHash();
    const courseExists = coursesRef.current.some((c) => c.slug === course);

    if (!course || !courseExists) {
      saveActiveReadingPosition();
      setActiveCourseId(null);
      setActiveSlug(null);
      setContent({ status: "courses", html: "", errorMessage: "" });
      window.scrollTo({ top: 0 });
      return;
    }

    const chapters = chaptersByCourseRef.current[course] || [];
    const knownChapter =
      chapter && chapters.some((ch) => ch.slug === chapter) ? chapter : null;

    if (knownChapter) {
      selectChapter(course, knownChapter, {});
    } else if (chapters.length) {
      selectChapter(course, chapters[0].slug, {});
      window.history.replaceState(null, "", `#/${course}/${chapters[0].slug}`);
    } else {
      selectChapter(course, null, {});
    }
  }, [saveActiveReadingPosition, selectChapter]);

  // Load course list + all chapter lists, then run the initial navigation once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let coursesData = [];
      let chaptersMap = {};
      try {
        const res = await fetch("/courses.json");
        coursesData = await res.json();
        await Promise.all(
          coursesData.map(async (course) => {
            try {
              const r = await fetch(course.chaptersUrl);
              chaptersMap[course.slug] = r.ok ? await r.json() : [];
            } catch {
              chaptersMap[course.slug] = [];
            }
          })
        );
      } catch {
        // courses.json unavailable — fall through with empty state.
      }
      if (cancelled) return;

      setCourses(coursesData);
      setChaptersByCourse(chaptersMap);
      coursesRef.current = coursesData;
      chaptersByCourseRef.current = chaptersMap;
      setReadByCourse(
        Object.fromEntries(coursesData.map((c) => [c.slug, getReadSlugs(c.slug)]))
      );

      if (bootstrappedRef.current) return;
      bootstrappedRef.current = true;

      // Deep link (#/course/chapter or #/course) takes precedence.
      const { course, chapter } = parseHash();
      if (course && coursesData.some((c) => c.slug === course)) {
        const chapters = chaptersMap[course] || [];
        const knownChapter =
          chapter && chapters.some((ch) => ch.slug === chapter) ? chapter : null;

        if (knownChapter) {
          selectChapter(course, knownChapter, { restorePosition: true });
        } else if (chapters.length) {
          selectChapter(course, chapters[0].slug, { restorePosition: true });
          window.history.replaceState(null, "", `#/${course}/${chapters[0].slug}`);
        } else {
          selectChapter(course, null, {});
        }
        return;
      }

      // No deep link: offer to resume the last-read chapter, otherwise land on
      // the course picker.
      const candidate =
        coursesData.find((c) => getLastReadingSlug(c.slug)) || coursesData[0];
      if (candidate) {
        const chapters = chaptersMap[candidate.slug] || [];
        const firstSlug = chapters[0]?.slug;
        const lastSlug = getLastReadingSlug(candidate.slug);
        const canResume =
          lastSlug &&
          firstSlug &&
          lastSlug !== firstSlug &&
          chapters.some((ch) => ch.slug === lastSlug);

        if (canResume && window.confirm("Do you want to resume your reading?")) {
          selectChapter(candidate.slug, lastSlug, { restorePosition: true });
          window.history.replaceState(null, "", `#/${candidate.slug}/${lastSlug}`);
          return;
        }

        if (firstSlug) {
          selectChapter(candidate.slug, firstSlug, {});
          window.history.replaceState(null, "", `#/${candidate.slug}/${firstSlug}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectChapter]);

  // Hash-based navigation.
  useEffect(() => {
    const onHashChange = () => handleRoute();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [handleRoute]);

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

  const selectCourse = useCallback(
    (courseId) => {
      const chapters = chaptersByCourseRef.current[courseId] || [];
      if (chapters.length) {
        navigateToChapter(courseId, chapters[0].slug);
      } else {
        window.location.hash = `/${courseId}`;
      }
    },
    [navigateToChapter]
  );

  const goHome = useCallback(() => {
    if (window.location.hash !== "#/") {
      window.location.hash = "/";
    }
  }, []);

  const toggleRead = () => {
    if (!activeCourseId || !activeSlug) return;
    const next = setChapterRead(
      activeCourseId,
      activeSlug,
      !(readByCourse[activeCourseId] || new Set()).has(activeSlug)
    );
    setReadByCourse((prev) => ({ ...prev, [activeCourseId]: next }));
  };

  const goToOffset = (offset) => {
    const chapters = chaptersByCourseRef.current[activeCourseId] || [];
    const idx = chapters.findIndex((ch) => ch.slug === activeSlug);
    const target = idx + offset;
    if (target >= 0 && target < chapters.length) {
      navigateToChapter(activeCourseId, chapters[target].slug);
    }
  };

  const activeCourse = courses.find((c) => c.slug === activeCourseId) || null;
  const activeChapters = activeCourseId ? chaptersByCourse[activeCourseId] || [] : [];
  const activeReadSlugs = readByCourse[activeCourseId] || new Set();
  const chapterIndex = activeChapters.findIndex((ch) => ch.slug === activeSlug);

  const courseCards = courses.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    chapterCount: (chaptersByCourse[c.slug] || []).length,
  }));

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
          courses={courseCards}
          activeCourseId={activeCourseId}
          activeSlug={activeSlug}
          chaptersByCourse={chaptersByCourse}
          readByCourse={readByCourse}
          collapsed={collapsed}
          onSelectCourse={selectCourse}
          onSelectChapter={navigateToChapter}
          onGoHome={goHome}
        />

        <ChapterView
          status={content.status}
          html={content.html}
          errorMessage={content.errorMessage}
          courses={courseCards}
          activeCourse={activeCourse}
          chapterIndex={chapterIndex}
          totalChapters={activeChapters.length}
          readCount={activeReadSlugs.size}
          isActiveRead={!!activeSlug && activeReadSlugs.has(activeSlug)}
          onSelectCourse={selectCourse}
          onToggleRead={toggleRead}
          onPrev={() => goToOffset(-1)}
          onNext={() => goToOffset(1)}
        />
      </div>
    </>
  );
}
