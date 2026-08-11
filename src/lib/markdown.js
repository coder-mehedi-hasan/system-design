// Minimal markdown -> HTML renderer (no external dependencies).
export function renderMarkdown(src) {
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
