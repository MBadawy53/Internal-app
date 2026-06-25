import MarkdownIt from "markdown-it";

// Default config disables raw HTML in markdown input (`html: false`), so
// any <tag> a user types is escaped rather than rendered — no XSS surface.
// linkify auto-links plain URLs; breaks turns newlines into <br/>.
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

// Open links in a new tab and harden them.
const defaultLinkOpen =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]!;
  let href = token.attrGet("href") ?? "";
  // Allow only http(s) and mailto links.
  if (!/^(https?:|mailto:)/i.test(href)) href = "#";
  token.attrSet("href", href);
  token.attrSet("target", "_blank");
  token.attrSet("rel", "noopener noreferrer");
  return defaultLinkOpen(tokens, idx, options, env, self);
};

export function renderSafeMarkdown(input: string | null | undefined): string {
  if (!input || input.trim() === "") return "";
  return md.render(input);
}
