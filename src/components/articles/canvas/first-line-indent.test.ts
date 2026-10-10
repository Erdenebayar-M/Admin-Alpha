// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { describe, expect, it } from "vitest";
import { blocksToDoc, docToBlocks, type TiptapDocument } from "@/lib/article-body";
import type { ArticleBlock } from "@/lib/article-types";
import { createColorMenuStore } from "./color/color-menu-store";
import { articleCanvasExtensions } from "./extensions";
import { applyBlockAttrs } from "./color/color-commands";
import { toggleList } from "./list-commands";
import { createMediaDialogStore } from "./media-dialog-store";
import { createSlashMenuStore } from "./slash-menu-store";

/**
 * First-line indent (ADR 0006) through the real canvas: a headless `Editor`
 * built from `articleCanvasExtensions`, driven by real DOM key events (see
 * `list-marker.test.ts` for why not `commands.keyboardShortcut`), asserted on
 * the Body `docToBlocks` would save.
 */

function newEditor(blocks: ArticleBlock[]) {
  return new Editor({
    extensions: articleCanvasExtensions(createSlashMenuStore(), createMediaDialogStore(), createColorMenuStore()),
    content: blocksToDoc(blocks),
  });
}

/** The Body a save would send, ids dropped (new Blocks get random ones). */
function body(editor: Editor) {
  return docToBlocks(editor.getJSON() as TiptapDocument).map((block) => {
    const rest: Partial<ArticleBlock> = { ...block };
    delete rest.id;
    return rest;
  });
}

/** Dispatches a real keydown; returns whether the canvas consumed it (so the browser won't move focus). */
function press(editor: Editor, key: string, init: KeyboardEventInit = {}): boolean {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  editor.view.dom.dispatchEvent(event);
  return event.defaultPrevented;
}

const tab = (editor: Editor) => press(editor, "Tab");
const shiftTab = (editor: Editor) => press(editor, "Tab", { shiftKey: true });

/** Puts the cursor `offset` characters into the text of the first node whose text includes `text`. */
function cursorIn(editor: Editor, text: string, offset = 0) {
  let target = -1;
  editor.state.doc.descendants((node, pos) => {
    if (target !== -1) return false;
    if (node.isText && node.text?.includes(text)) target = pos + node.text.indexOf(text) + offset;
    return true;
  });
  if (target === -1) throw new Error(`no text "${text}"`);
  editor.commands.setTextSelection(target);
}

const paragraph = (text: string, extra: Partial<ArticleBlock> = {}): ArticleBlock =>
  ({ id: `p-${text}`, type: "paragraph", content: [{ text }], ...extra }) as ArticleBlock;

describe("Tab and Shift+Tab on a paragraph", () => {
  it.each([
    ["at the start", 0],
    ["in the middle", 3],
    ["at the end", "догол мөр".length],
  ])("Tab %s of a left-aligned paragraph turns the indent on", (_label, offset) => {
    const editor = newEditor([paragraph("догол мөр")]);
    cursorIn(editor, "догол мөр", offset);
    expect(tab(editor)).toBe(true);
    expect(body(editor)).toEqual([{ type: "paragraph", content: [{ text: "догол мөр" }], indent: true }]);
  });

  it("Tab on an already indented paragraph changes nothing — there are no levels", () => {
    const editor = newEditor([paragraph("догол мөр", { indent: true })]);
    cursorIn(editor, "мөр");
    const before = editor.getJSON();
    expect(tab(editor)).toBe(true);
    expect(editor.getJSON()).toEqual(before);
    expect(body(editor)).toEqual([{ type: "paragraph", content: [{ text: "догол мөр" }], indent: true }]);
  });

  it.each([
    ["at the start", 0],
    ["in the middle", 3],
  ])("Shift+Tab %s of an indented paragraph turns the indent off", (_label, offset) => {
    const editor = newEditor([paragraph("догол мөр", { indent: true })]);
    cursorIn(editor, "догол мөр", offset);
    expect(shiftTab(editor)).toBe(true);
    expect(body(editor)).toEqual([{ type: "paragraph", content: [{ text: "догол мөр" }] }]);
  });

  it("only the paragraph holding the cursor is indented", () => {
    const editor = newEditor([paragraph("нэг"), paragraph("хоёр")]);
    cursorIn(editor, "хоёр", 1);
    tab(editor);
    expect(body(editor)).toEqual([
      { type: "paragraph", content: [{ text: "нэг" }] },
      { type: "paragraph", content: [{ text: "хоёр" }], indent: true },
    ]);
  });

  it("survives a save and reopen", () => {
    const editor = newEditor([paragraph("догол мөр")]);
    cursorIn(editor, "мөр");
    tab(editor);
    const saved = docToBlocks(editor.getJSON() as TiptapDocument);
    const reopened = newEditor(saved);
    expect(body(reopened)).toEqual([{ type: "paragraph", content: [{ text: "догол мөр" }], indent: true }]);
  });
});

describe("Enter in an indented paragraph", () => {
  it("at the end starts the next paragraph indented too", () => {
    const editor = newEditor([paragraph("эхний", { indent: true })]);
    cursorIn(editor, "эхний", "эхний".length);
    press(editor, "Enter");
    editor.commands.insertContent("дараах");
    expect(body(editor)).toEqual([
      { type: "paragraph", content: [{ text: "эхний" }], indent: true },
      { type: "paragraph", content: [{ text: "дараах" }], indent: true },
    ]);
  });

  it("in the middle leaves both halves indented", () => {
    const editor = newEditor([paragraph("нэгхоёр", { indent: true })]);
    cursorIn(editor, "нэгхоёр", 3);
    press(editor, "Enter");
    expect(body(editor)).toEqual([
      { type: "paragraph", content: [{ text: "нэг" }], indent: true },
      { type: "paragraph", content: [{ text: "хоёр" }], indent: true },
    ]);
  });
});

describe("where Tab does nothing (but still never moves focus out of the canvas)", () => {
  it.each<[string, ArticleBlock, string]>([
    ["a list item", { id: "l", type: "list", style: "bullet", items: [{ spans: [{ text: "зүйл" }] }] }, "зүйл"],
    ["a subheading", { id: "h", type: "heading", level: 2, text: "гарчиг" }, "гарчиг"],
    ["a quote", { id: "q", type: "quote", content: [{ text: "ишлэл" }] }, "ишлэл"],
    ["a callout", { id: "c", type: "callout", content: [{ text: "анхаар" }] }, "анхаар"],
    ["a centred paragraph", paragraph("төвд", { alignment: "center" }), "төвд"],
    ["a right-aligned paragraph", paragraph("баруун", { alignment: "right" }), "баруун"],
  ])("in %s", (_label, block, text) => {
    const editor = newEditor([block]);
    cursorIn(editor, text, 1);
    const before = editor.getJSON();
    expect(tab(editor)).toBe(true);
    expect(editor.getJSON()).toEqual(before);
    expect(shiftTab(editor)).toBe(true);
    expect(editor.getJSON()).toEqual(before);
  });

  it("on a selected media Block", () => {
    const editor = newEditor([paragraph("өмнө"), { id: "d", type: "divider" }, { id: "k", type: "link_card", url: "https://example.com", title: "карт" }]);
    let mediaPos = -1;
    editor.state.doc.forEach((node, offset) => {
      if (node.attrs.block) mediaPos = offset;
    });
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, mediaPos)));
    const before = editor.getJSON();
    expect(tab(editor)).toBe(true);
    expect(editor.getJSON()).toEqual(before);
  });
});

describe("the / menu", () => {
  it("keeps its own Tab handling while open: Tab picks the highlighted command, no indent", async () => {
    const slashMenu = createSlashMenuStore();
    const editor = new Editor({
      extensions: articleCanvasExtensions(slashMenu, createMediaDialogStore(), createColorMenuStore()),
      content: blocksToDoc([paragraph("текст")]),
    });
    cursorIn(editor, "текст", "текст".length);
    editor.commands.insertContent(" /h2");
    // The suggestion plugin opens the menu from its view update, a tick later.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(slashMenu.getSnapshot()).not.toBeNull();
    expect(tab(editor)).toBe(true);
    const saved = body(editor);
    expect(saved.some((b) => b.type === "heading")).toBe(true);
    expect(saved.some((b) => b.type === "paragraph" && b.indent)).toBe(false);
  });
});

describe("an indent only ever stays on a top-level, left-aligned paragraph", () => {
  it("is dropped when the paragraph is centred, and doesn't come back when it returns to left", () => {
    const editor = newEditor([paragraph("догол мөр", { indent: true })]);
    cursorIn(editor, "мөр");
    applyBlockAttrs(editor, { alignment: "center" });
    expect(body(editor)).toEqual([{ type: "paragraph", content: [{ text: "догол мөр" }], alignment: "center" }]);
    expect(editor.getHTML()).not.toContain("data-indent");
    applyBlockAttrs(editor, { alignment: null });
    expect(body(editor)).toEqual([{ type: "paragraph", content: [{ text: "догол мөр" }] }]);
  });

  it("is dropped when indented paragraphs become a list", () => {
    const editor = newEditor([paragraph("нэг", { indent: true }), paragraph("хоёр", { indent: true })]);
    editor.commands.selectAll();
    toggleList(editor, "bulletList");
    expect(editor.getHTML()).not.toContain("data-indent");
  });

  it("isn't loaded onto a stored centred paragraph that somehow has one", () => {
    const editor = newEditor([paragraph("төвд", { alignment: "center", indent: true })]);
    expect(editor.getHTML()).not.toContain("data-indent");
  });
});
