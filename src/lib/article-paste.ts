/**
 * Paste clean-up for content copied from Word or Google Docs. Runs on the
 * pasted HTML before the canvas parses it, reshaping what the Article Body
 * can't hold into what it can instead of silently losing it:
 *
 * - H1 → H2, H4–H6 → H3 (the Body only has heading levels 2 and 3)
 * - underline / strike / font / colour formatting stripped (bold, italic and
 *   links are the only inline formatting the Body keeps)
 * - nested lists flattened to one level, items kept in reading order
 * - table cells become paragraphs
 * - a blockquote keeps only its first paragraph; the rest follow it as
 *   paragraphs (a quote Block holds a single run of text)
 *
 * `changed` tells the canvas whether to show the "formatting simplified" notice.
 */

const UNWRAP_TAGS = ["u", "ins", "s", "strike", "del", "font", "mark"];
// Google Docs marks bold/italic with inline styles, which the canvas reads — keep those.
const KEPT_STYLES = ["font-weight", "font-style"];
const FORMATTING_STYLES = new Set([
  "color",
  "background",
  "background-color",
  "font-family",
  "font-size",
  "text-decoration",
  "text-decoration-line",
]);
const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "DIV", "BLOCKQUOTE"]);
const LIST_SELECTOR = "ul, ol";

function renameElement(el: Element, tag: string) {
  const next = el.ownerDocument.createElement(tag);
  next.append(...Array.from(el.childNodes));
  el.replaceWith(next);
}

function unwrap(el: Element) {
  el.replaceWith(...Array.from(el.childNodes));
}

/** Cell contents as block nodes: existing blocks kept, loose inline runs wrapped in a <p>. */
function cellBlocks(cell: Element): Node[] {
  const doc = cell.ownerDocument;
  const blocks: Node[] = [];
  let run: Node[] = [];
  const flush = () => {
    if (run.some((n) => n.textContent?.trim())) {
      const p = doc.createElement("p");
      p.append(...run);
      blocks.push(p);
    }
    run = [];
  };
  for (const child of Array.from(cell.childNodes)) {
    if (child instanceof Element && BLOCK_TAGS.has(child.tagName)) {
      flush();
      if (child.textContent?.trim()) blocks.push(child);
    } else {
      run.push(child);
    }
  }
  flush();
  return blocks;
}

function flattenTables(root: Element): boolean {
  // Innermost first, so a nested table's paragraphs are already in its cell.
  const tables = Array.from(root.querySelectorAll("table")).reverse();
  for (const table of tables) {
    const blocks = Array.from(table.querySelectorAll("th, td")).flatMap(cellBlocks);
    table.replaceWith(...blocks);
  }
  return tables.length > 0;
}

function flattenLists(root: Element): boolean {
  // Deepest first: each nested list's items move up one level into its
  // parent list, which is itself moved up when its turn comes.
  const nested = Array.from(root.querySelectorAll(LIST_SELECTOR))
    .filter((list) => list.parentElement?.closest(LIST_SELECTOR))
    .reverse();
  for (const list of nested) {
    const items = Array.from(list.children).filter((c) => c.tagName === "LI");
    const parent = list.parentElement;
    if (!parent) continue;
    if (parent.tagName === "LI") parent.after(...items);
    else list.before(...items);
    list.remove();
  }
  return nested.length > 0;
}

function splitBlockquotes(root: Element): boolean {
  let changed = false;
  for (const quote of Array.from(root.querySelectorAll("blockquote")).reverse()) {
    const blocks = Array.from(quote.children).filter((c) => BLOCK_TAGS.has(c.tagName));
    if (blocks.length < 2) continue;
    quote.after(...blocks.slice(1));
    changed = true;
  }
  return changed;
}

function normalizeHeadings(root: Element): boolean {
  const headings = Array.from(root.querySelectorAll("h1, h4, h5, h6"));
  for (const h of headings) renameElement(h, h.tagName === "H1" ? "h2" : "h3");
  return headings.length > 0;
}

function stripFormatting(root: Element): boolean {
  let changed = false;
  for (const el of Array.from(root.querySelectorAll(UNWRAP_TAGS.join(", ")))) {
    unwrap(el);
    changed = true;
  }
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("[style]"))) {
    const style = el.style;
    const kept = KEPT_STYLES.map((prop) => [prop, style.getPropertyValue(prop)] as const).filter(([, v]) => v);
    const props = Array.from({ length: style.length }, (_, i) => style.item(i));
    if (props.some((p) => FORMATTING_STYLES.has(p) || p.startsWith("text-decoration"))) changed = true;
    if (props.length === kept.length) continue;
    el.removeAttribute("style");
    for (const [prop, value] of kept) el.style.setProperty(prop, value);
  }
  return changed;
}

export function cleanPastedContent(html: string): { html: string; changed: boolean } {
  const root = new DOMParser().parseFromString(html, "text/html").body;
  // Every step runs — no short-circuiting on an earlier change.
  const results = [
    flattenTables(root),
    flattenLists(root),
    splitBlockquotes(root),
    normalizeHeadings(root),
    stripFormatting(root),
  ];
  return { html: root.innerHTML, changed: results.some(Boolean) };
}
