const YOUTUBE_HOSTS = ["youtube.com", "youtu.be"];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseYouTubeUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/^m\./, "");
  if (!YOUTUBE_HOSTS.includes(host)) return null;

  let videoId = null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (host === "youtu.be") {
    videoId = segments[0] || null;
  } else if (url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else if (
    segments[0] === "shorts" ||
    segments[0] === "embed" ||
    segments[0] === "live"
  ) {
    videoId = segments[1] || null;
  }

  return { videoId, listId: url.searchParams.get("list") };
}

export function youtubeEmbedHtml(rawUrl) {
  const parsed = parseYouTubeUrl(rawUrl);

  if (!parsed || (!parsed.videoId && !parsed.listId)) {
    return `<p><a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener noreferrer">Open video ↗</a></p>`;
  }

  let src;
  let label;
  if (parsed.videoId) {
    src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(parsed.videoId)}`;
    if (parsed.listId) src += `?list=${encodeURIComponent(parsed.listId)}`;
    label = "Watch on YouTube ↗";
  } else {
    src = `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(parsed.listId)}`;
    label = "Open playlist on YouTube ↗";
  }

  return (
    `<div class="video-embed"><iframe src="${src}" title="YouTube player" ` +
    `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ` +
    `allowfullscreen></iframe></div>` +
    `<p><a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener noreferrer">${label}</a></p>`
  );
}
