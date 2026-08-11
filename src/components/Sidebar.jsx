import { usePwa } from "../hooks/usePwa.js";

function ChapterRow({ title, isActive, isRead, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-md px-[10px] py-2 text-left text-[13px] leading-[1.4] cursor-pointer
        ${isActive
          ? "bg-[var(--accent-bg)] font-semibold text-[var(--accent)]"
          : isRead
            ? "text-[var(--text-muted)] hover:bg-[#ececef]"
            : "text-[var(--text)] hover:bg-[#ececef]"}`}
    >
      <span
        className={`h-[6px] w-[6px] shrink-0 rounded-full bg-[#22a06b] ${isRead ? "opacity-100" : "opacity-0"}`}
      />
      <span className="min-w-0 flex-1">{title}</span>
    </button>
  );
}

export default function Sidebar({
  courses,
  activeCourseId,
  activeSlug,
  chaptersByCourse,
  readByCourse,
  collapsed,
  onSelectCourse,
  onSelectChapter,
  onGoHome,
}) {
  const { canInstall, promptInstall, isOnline } = usePwa();

  return (
    <aside
      className={`sticky top-0 h-screen shrink-0 overflow-y-auto overflow-x-hidden bg-[var(--sidebar-bg)] transition-[width,opacity,transform] duration-200 ease-in-out
        ${collapsed
          ? "w-0 opacity-0 pointer-events-none border-r-0"
          : "w-[300px] opacity-100 border-r border-[var(--border)]"}
        max-md:fixed max-md:left-0 max-md:top-0 max-md:z-[25] max-md:!w-[280px] max-md:max-w-[82vw] max-md:!opacity-100 max-md:shadow-[2px_0_16px_rgba(0,0,0,0.12)] max-md:pointer-events-auto max-md:border-r max-md:border-[var(--border)]
        ${collapsed ? "max-md:-translate-x-full" : "max-md:translate-x-0"}`}
    >
      <div className="border-b border-[var(--border)] px-[18px] pb-[14px] pl-14 pt-5 max-[480px]:pl-[52px]">
        <button
          type="button"
          onClick={onGoHome}
          className="m-0 mb-1 block cursor-pointer text-base font-semibold text-[var(--text)] hover:text-[var(--accent)]"
        >
          Courses
        </button>
        <p className="m-0 text-xs text-[var(--text-muted)]">
          {courses.length} courses · tap one to open its chapters
        </p>

        {canInstall && (
          <button
            type="button"
            onClick={promptInstall}
            className="mt-[10px] flex items-center gap-[6px] rounded-full border border-[var(--accent)] bg-[var(--accent-bg)] px-3 py-[6px] text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 12.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Install app
          </button>
        )}

        {!isOnline && (
          <span className="mt-[10px] inline-block rounded-full bg-[#fff4e5] px-[10px] py-[3px] text-[11px] font-semibold text-[#9a5b00]">
            Offline
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-[2px] p-2">
        {courses.map((course) => {
          const isExpanded = course.slug === activeCourseId;
          const chapters = chaptersByCourse[course.slug] || [];
          const readSet = readByCourse[course.slug] || new Set();

          return (
            <div key={course.slug}>
              <button
                type="button"
                onClick={() => onSelectCourse(course.slug)}
                className={`flex w-full items-center gap-2 rounded-md px-[10px] py-2 text-left text-[13px] leading-[1.4] cursor-pointer
                  ${isExpanded
                    ? "bg-[var(--accent-bg)] font-semibold text-[var(--accent)]"
                    : "text-[var(--text)] hover:bg-[#ececef]"}`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`shrink-0 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
                >
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="min-w-0 flex-1">{course.title}</span>
                {chapters.length > 0 && (
                  <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                    {readSet.size}/{chapters.length}
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="mb-1 flex flex-col gap-[2px] border-l border-[var(--border)] pl-4 ml-[17px]">
                  {chapters.length === 0 && (
                    <p className="px-[10px] py-2 text-[13px] text-[var(--text-muted)]">
                      No chapters yet.
                    </p>
                  )}
                  {chapters.map((ch) => (
                    <ChapterRow
                      key={ch.slug}
                      title={ch.title}
                      isActive={ch.slug === activeSlug}
                      isRead={readSet.has(ch.slug)}
                      onSelect={() => onSelectChapter(course.slug, ch.slug)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
