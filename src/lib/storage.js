// localStorage-backed persistence for read history, last chapter, and per-chapter scroll positions.

const READ_STORAGE_KEY = "read-chapters";
const LAST_CHAPTER_STORAGE_KEY = "last-reading-chapter";
const READING_POSITION_STORAGE_KEY = "chapter-reading-positions";
export const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

export function getReadSlugs() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveReadSlugs(set) {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...set]));
}

export function isChapterRead(slug) {
  return getReadSlugs().has(slug);
}

export function setChapterRead(slug, read) {
  const set = getReadSlugs();
  if (read) set.add(slug);
  else set.delete(slug);
  saveReadSlugs(set);
  return set;
}

export function getLastReadingSlug() {
  return localStorage.getItem(LAST_CHAPTER_STORAGE_KEY);
}

export function setLastReadingSlug(slug) {
  localStorage.setItem(LAST_CHAPTER_STORAGE_KEY, slug);
}

function getReadingPositions() {
  try {
    const raw = localStorage.getItem(READING_POSITION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveReadingPositions(positions) {
  localStorage.setItem(READING_POSITION_STORAGE_KEY, JSON.stringify(positions));
}

export function getChapterReadingPosition(slug) {
  const value = getReadingPositions()[slug];
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function setChapterReadingPosition(slug, scrollY) {
  if (!slug || !Number.isFinite(scrollY)) return;
  const positions = getReadingPositions();
  positions[slug] = Math.max(0, Math.round(scrollY));
  saveReadingPositions(positions);
}
