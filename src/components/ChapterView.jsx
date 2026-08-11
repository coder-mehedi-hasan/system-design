export default function ChapterView({
  html,
  status,
  errorMessage,
  chapterIndex,
  totalChapters,
  readCount,
  isActiveRead,
  courses,
  activeCourse,
  onSelectCourse,
  onToggleRead,
  onPrev,
  onNext,
}) {
  const hasActive = activeCourse && chapterIndex !== -1;

  return (
    <main className="flex flex-1 min-w-0 justify-center px-12 pb-20 pt-10 max-md:px-5 max-md:pb-[60px] max-md:pt-[72px] max-[480px]:px-4 max-[480px]:pb-12 max-[480px]:pt-[68px]">
      <div className="w-full max-w-[760px]">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-[6px]">
            {activeCourse && (
              <>
                <span className="text-xs font-semibold text-[var(--text)]">
                  {activeCourse.title}
                </span>
                {hasActive && (
                  <>
                    <span className="text-xs text-[var(--border)]">·</span>
                    <span className="text-xs text-[var(--text)]">
                      Chapter {chapterIndex + 1} of {totalChapters}
                    </span>
                  </>
                )}
                <span className="text-xs text-[var(--border)]">·</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {readCount}/{totalChapters} read
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleRead}
            disabled={!hasActive}
            className={`flex items-center gap-[6px] rounded-full border px-3 py-[6px] text-xs font-medium cursor-pointer disabled:cursor-default disabled:opacity-50
              ${isActiveRead
                ? "border-[#b7ebc6] bg-[#ecfdf3] text-[#12734b]"
                : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--sidebar-bg)] hover:text-[var(--text)]"}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={isActiveRead ? "opacity-100" : "opacity-50"}
            >
              <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{isActiveRead ? "Read" : "Mark as read"}</span>
          </button>
        </div>

        <div className="markdown-body w-full">
          {status === "courses" && (
            <CoursePicker courses={courses} onSelectCourse={onSelectCourse} />
          )}
          {status === "course-empty" && (
            <div className="mt-[60px] text-center text-sm text-[var(--text-muted)]">
              This course doesn't have any chapters yet.
            </div>
          )}
          {status === "loading" && (
            <div className="mt-[60px] text-center text-sm text-[var(--text-muted)]">Loading…</div>
          )}
          {status === "empty" && (
            <div className="mt-[60px] text-center text-sm text-[var(--text-muted)]">
              Select a course from the left to begin reading.
            </div>
          )}
          {status === "error" && (
            <div className="text-sm text-[#b42318]">{errorMessage}</div>
          )}
          {status === "ready" && (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
          <button
            type="button"
            onClick={onPrev}
            disabled={chapterIndex <= 0}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-[9px] text-[13px] font-medium text-[var(--text)] cursor-pointer hover:bg-[var(--sidebar-bg)] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-[var(--bg)]"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasActive || chapterIndex >= totalChapters - 1}
            className="ml-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-[9px] text-[13px] font-medium text-[var(--text)] cursor-pointer hover:bg-[var(--sidebar-bg)] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-[var(--bg)]"
          >
            Next →
          </button>
        </div>
      </div>
    </main>
  );
}

function CoursePicker({ courses, onSelectCourse }) {
  return (
    <div className="mt-[30px]">
      <h1 className="text-2xl font-semibold text-[var(--text)]">Choose a course</h1>
      <p className="mb-6 text-sm text-[var(--text-muted)]">
        Pick a course to open its chapters.
      </p>
      <div className="flex flex-col gap-3">
        {courses.map((course) => (
          <button
            key={course.slug}
            type="button"
            onClick={() => onSelectCourse(course.slug)}
            className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]"
          >
            <span className="block text-[15px] font-semibold text-[var(--text)]">
              {course.title}
            </span>
            {course.description && (
              <span className="mt-1 block text-[13px] text-[var(--text-muted)]">
                {course.description}
              </span>
            )}
            <span className="mt-3 inline-block rounded-full bg-[var(--sidebar-bg)] px-3 py-[3px] text-[11px] font-semibold text-[var(--text-muted)]">
              {course.chapterCount} {course.chapterCount === 1 ? "chapter" : "chapters"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
