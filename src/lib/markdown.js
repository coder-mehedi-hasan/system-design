// Markdown rendering that mirrors VS Code's "Markdown Preview Enhanced":
// markdown-it as the engine + Prism for code syntax highlighting.
import MarkdownIt from "markdown-it";
import Prism from "prismjs";

// Prism language grammars used by the course content (see fenced code blocks).
import "prismjs/components/prism-markup"; // html
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript"; // js / javascript
import "prismjs/components/prism-json";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";

// Prism token colors (light theme, close to MPE's default preview).
import "prismjs/themes/prism.css";

// Map the language tags used in the markdown to Prism grammar names.
const LANG_ALIASES = { js: "javascript", shell: "bash", sh: "bash", html: "markup" };

const md = new MarkdownIt({
  html: true, // allow inline HTML such as <br>
  linkify: true, // auto-link bare URLs
  breaks: true, // MPE's "breakOnSingleNewLine" — single \n becomes <br>
  typographer: false,
  highlight(code, lang) {
    const name = LANG_ALIASES[lang] || lang;
    if (name && Prism.languages[name]) {
      try {
        const highlighted = Prism.highlight(code, Prism.languages[name], name);
        return `<pre class="language-${name}"><code class="language-${name}">${highlighted}</code></pre>`;
      } catch {
        // fall through to the escaped default below
      }
    }
    return `<pre><code>${md.utils.escapeHtml(code)}</code></pre>`;
  },
});

// Open links in a new tab, matching the previous behavior.
const defaultLinkOpen =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token.attrSet("target", "_blank");
  token.attrSet("rel", "noopener");
  return defaultLinkOpen(tokens, idx, options, env, self);
};

export function renderMarkdown(src) {
  return md.render(src);
}
