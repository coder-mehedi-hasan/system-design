// Minimal markdown -> HTML renderer (no external dependencies).
function renderMarkdown(src) {
  const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Pull out fenced code blocks first so their contents are never touched.
  const codeBlocks = [];
  src = src.replace(/```([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(code.replace(/^\w*\n/, ""));
    return ` CODEBLOCK${idx} `;
  });

  const BR_PLACEHOLDER = " BR ";

  const applyInline = (text) => {
    text = text.replace(/<br\s*\/?>/gi, BR_PLACEHOLDER);
    text = escapeHtml(text);
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    text = text.replace(/\\([=+~.!])/g, "$1");
    text = text.split(BR_PLACEHOLDER).join("<br>");
    return text;
  };

  const splitTableRow = (line) => {
    let t = line.trim();
    if (t.startsWith("|")) t = t.slice(1);
    if (t.endsWith("|")) t = t.slice(0, -1);
    return t.split("|").map((c) => c.trim());
  };

  const isTableSeparator = (line) =>
    /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(line);

  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let i = 0;
  let listStack = null; // { type: 'ul'|'ol' }

  const closeList = () => {
    if (listStack) {
      html.push(listStack.type === "ul" ? "</ul>" : "</ol>");
      listStack = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) {
      closeList();
      i++;
      continue;
    }

    // headings
    let m = line.match(/^(#{1,4})\s+(.*)$/);
    if (m) {
      closeList();
      const level = m[1].length;
      html.push(`<h${level}>${applyInline(m[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // horizontal rule
    if (/^\s*-{3,}\s*$/.test(line) || /^\s*_{3,}\s*$/.test(line) || /^\s*\*{3,}\s*$/.test(line)) {
      closeList();
      html.push("<hr>");
      i++;
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      closeList();
      const quoteLines = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      html.push(`<blockquote><p>${applyInline(quoteLines.join(" "))}</p></blockquote>`);
      continue;
    }

    // unordered list
    m = line.match(/^\s*[*-]\s+(.*)$/);
    if (m) {
      if (!listStack || listStack.type !== "ul") {
        closeList();
        html.push("<ul>");
        listStack = { type: "ul" };
      }
      html.push(`<li>${applyInline(m[1])}</li>`);
      i++;
      continue;
    }

    // ordered list
    m = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (m) {
      if (!listStack || listStack.type !== "ol") {
        closeList();
        html.push("<ol>");
        listStack = { type: "ol" };
      }
      html.push(`<li>${applyInline(m[1])}</li>`);
      i++;
      continue;
    }

    // raw code block placeholder
    m = line.match(/^ CODEBLOCK(\d+) $/);
    if (m) {
      closeList();
      const code = codeBlocks[Number(m[1])];
      html.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
      i++;
      continue;
    }

    // table: a "| ... |" row followed by a "| --- |" alignment row
    if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      closeList();
      const headerCells = splitTableRow(line);
      i += 2;
      const bodyRows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        bodyRows.push(splitTableRow(lines[i]));
        i++;
      }
      let table = "<table><thead><tr>";
      table += headerCells.map((c) => `<th>${applyInline(c)}</th>`).join("");
      table += "</tr></thead>";
      if (bodyRows.length) {
        table += "<tbody>";
        table += bodyRows
          .map((row) => "<tr>" + row.map((c) => `<td>${applyInline(c)}</td>`).join("") + "</tr>")
          .join("");
        table += "</tbody>";
      }
      table += "</table>";
      html.push(table);
      continue;
    }

    // paragraph: gather consecutive non-blank, non-special lines
    closeList();
    const paraLines = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*[*-]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*-{3,}\s*$/.test(lines[i]) &&
      !/^ CODEBLOCK\d+ $/.test(lines[i]) &&
      !(/^\s*\|/.test(lines[i]) && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    html.push(`<p>${applyInline(paraLines.join("\n"))}</p>`);
  }

  closeList();
  return html.join("\n");
}

const state = { chapters: [], activeSlug: null };

// Read history, persisted in localStorage as an array of chapter slugs.

const READ_STORAGE_KEY = "read-chapters";

function getReadSlugs() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadSlugs(set) {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...set]));
}

function isChapterRead(slug) {
  return getReadSlugs().has(slug);
}

function setChapterRead(slug, read) {
  const set = getReadSlugs();
  if (read) set.add(slug);
  else set.delete(slug);
  saveReadSlugs(set);
}

function updateReadUI() {
  const readSlugs = getReadSlugs();

  document.querySelectorAll(".chapter-item").forEach((el) => {
    el.classList.toggle("is-read", readSlugs.has(el.dataset.slug));
  });

  const progressEl = document.getElementById("read-progress");
  if (progressEl && state.chapters.length) {
    progressEl.textContent = `${readSlugs.size}/${state.chapters.length} read`;
  }

  const markBtn = document.getElementById("mark-read-btn");
  const markLabel = document.getElementById("mark-read-label");
  if (markBtn && markLabel && state.activeSlug) {
    const read = readSlugs.has(state.activeSlug);
    markBtn.classList.toggle("is-read", read);
    markLabel.textContent = read ? "Read" : "Mark as read";
  }
}

function updateNavButtons() {
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const idx = state.chapters.findIndex((ch) => ch.slug === state.activeSlug);

  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx === -1 || idx >= state.chapters.length - 1;
}

async function loadChapterList() {
  const res = await fetch("chapters.json");
  state.chapters = await res.json();
  const nav = document.getElementById("chapter-list");
  nav.innerHTML = "";
  state.chapters.forEach((ch) => {
    const btn = document.createElement("button");
    btn.className = "chapter-item";
    btn.dataset.slug = ch.slug;

    const dot = document.createElement("span");
    dot.className = "read-dot";
    btn.appendChild(dot);

    const label = document.createElement("span");
    label.className = "chapter-item-label";
    label.textContent = ch.title;
    btn.appendChild(label);

    btn.addEventListener("click", () => selectChapter(ch.slug));
    nav.appendChild(btn);
  });
  updateReadUI();
}

async function selectChapter(slug) {
  state.activeSlug = slug;
  document.querySelectorAll(".chapter-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.slug === slug);
  });

  const view = document.getElementById("markdown-view");
  view.innerHTML = '<div class="placeholder">Loading…</div>';

  try {
    const res = await fetch(`beginner/${slug}.md`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const md = await res.text();
    view.innerHTML = renderMarkdown(md);
    window.scrollTo({ top: 0 });
  } catch (err) {
    view.innerHTML = `<div class="error">Could not load "${slug}.md" — ${err.message}. Make sure you're serving this folder over HTTP (not opening index.html directly as a file).</div>`;
  }

  updateReadUI();
  updateNavButtons();

  if (mobileQuery.matches) setSidebarCollapsed(true);
}

function initChapterControls() {
  document.getElementById("mark-read-btn").addEventListener("click", () => {
    if (!state.activeSlug) return;
    setChapterRead(state.activeSlug, !isChapterRead(state.activeSlug));
    updateReadUI();
  });

  document.getElementById("prev-btn").addEventListener("click", () => {
    const idx = state.chapters.findIndex((ch) => ch.slug === state.activeSlug);
    if (idx > 0) selectChapter(state.chapters[idx - 1].slug);
  });

  document.getElementById("next-btn").addEventListener("click", () => {
    const idx = state.chapters.findIndex((ch) => ch.slug === state.activeSlug);
    if (idx !== -1 && idx < state.chapters.length - 1) {
      selectChapter(state.chapters[idx + 1].slug);
    }
  });
}

initChapterControls();

loadChapterList().then(() => {
  const firstSlug = new URLSearchParams(location.search).get("chapter") || state.chapters[0]?.slug;
  if (firstSlug) selectChapter(firstSlug);
});

// Sidebar toggle (desktop: collapses to width 0; mobile: slides in as an overlay drawer)

const mobileQuery = window.matchMedia("(max-width: 860px)");
const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

const appEl = document.getElementById("app");
const toggleBtn = document.getElementById("sidebar-toggle");
const backdropEl = document.getElementById("sidebar-backdrop");

function setSidebarCollapsed(collapsed) {
  appEl.classList.toggle("sidebar-collapsed", collapsed);
  toggleBtn.setAttribute("aria-expanded", String(!collapsed));
  localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
}

function initSidebarToggle() {
  const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
  const initialCollapsed = stored !== null ? stored === "1" : mobileQuery.matches;
  setSidebarCollapsed(initialCollapsed);

  toggleBtn.addEventListener("click", () => {
    setSidebarCollapsed(!appEl.classList.contains("sidebar-collapsed"));
  });

  backdropEl.addEventListener("click", () => setSidebarCollapsed(true));
}

initSidebarToggle();

// PWA: offline caching via service worker, install prompt, and online/offline badge

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

function initInstallPrompt() {
  const installBtn = document.getElementById("install-btn");
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installBtn.hidden = false;
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    installBtn.hidden = true;
  });
}

function initOfflineBadge() {
  const badge = document.getElementById("offline-badge");
  const update = () => {
    badge.hidden = navigator.onLine;
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

registerServiceWorker();
initInstallPrompt();
initOfflineBadge();
