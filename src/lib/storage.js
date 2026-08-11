// localStorage-backed persistence for read history, last chapter, and per-chapter
// scroll positions. Everything is scoped by course id so multiple courses don't
// overwrite each other's state.

const READ_STORAGE_KEY = (courseId) => `read-chapters:${courseId}`;
const LAST_CHAPTER_STORAGE_KEY = (courseId) => `last-reading-chapter:${courseId}`;
const READING_POSITION_STORAGE_KEY = (courseId) => `chapter-reading-positions:${courseId}`;
export const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

const LEGACY_KEYS = {
  read: "read-chapters",
  last: "last-reading-chapter",
  positions: "chapter-reading-positions",
};

// One-time migration: the pre-multi-course app stored everything under legacy
// keys. That data was all System Design content, so fold it into that course.
function migrateLegacyData(courseId) {
  if (courseId !== "system-design") return;
  try {
    if (localStorage.getItem(READ_STORAGE_KEY(courseId))) return;
    const legacyRead = localStorage.getItem(LEGACY_KEYS.read);
    const legacyLast = localStorage.getItem(LEGACY_KEYS.last);
    const legacyPositions = localStorage.getItem(LEGACY_KEYS.positions);
    if (legacyRead) localStorage.setItem(READ_STORAGE_KEY(courseId), legacyRead);
    if (legacyLast) localStorage.setItem(LAST_CHAPTER_STORAGE_KEY(courseId), legacyLast);
    if (legacyPositions) localStorage.setItem(READING_POSITION_STORAGE_KEY(courseId), legacyPositions);
    localStorage.removeItem(LEGACY_KEYS.read);
    localStorage.removeItem(LEGACY_KEYS.last);
    localStorage.removeItem(LEGACY_KEYS.positions);
  } catch {
    // best effort
  }
}

export function getReadSlugs(courseId) {
  migrateLegacyData(courseId);
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY(courseId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function setChapterRead(courseId, slug, read) {
  const set = getReadSlugs(courseId);
  if (read) set.add(slug);
  else set.delete(slug);
  localStorage.setItem(READ_STORAGE_KEY(courseId), JSON.stringify([...set]));
  return set;
}

export function getLastReadingSlug(courseId) {
  migrateLegacyData(courseId);
  return localStorage.getItem(LAST_CHAPTER_STORAGE_KEY(courseId));
}

export function setLastReadingSlug(courseId, slug) {
  localStorage.setItem(LAST_CHAPTER_STORAGE_KEY(courseId), slug);
}

function getReadingPositions(courseId) {
  try {
    const raw = localStorage.getItem(READING_POSITION_STORAGE_KEY(courseId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveReadingPositions(courseId, positions) {
  localStorage.setItem(READING_POSITION_STORAGE_KEY(courseId), JSON.stringify(positions));
}

export function getChapterReadingPosition(courseId, slug) {
  migrateLegacyData(courseId);
  const value = getReadingPositions(courseId)[slug];
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function setChapterReadingPosition(courseId, slug, scrollY) {
  if (!slug || !Number.isFinite(scrollY)) return;
  const positions = getReadingPositions(courseId);
  positions[slug] = Math.max(0, Math.round(scrollY));
  saveReadingPositions(courseId, positions);
}
