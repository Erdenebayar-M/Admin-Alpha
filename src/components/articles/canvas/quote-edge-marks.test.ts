// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { DOC_NODE } from "@/lib/article-body";
import { BLOCK_COMMANDS } from "./block-commands";
import { articleCanvasExtensions } from "./extensions";
import { createColorMenuStore } from "./color/color-menu-store";
import { createMediaDialogStore } from "./media-dialog-store";
import { createSlashMenuStore } from "./slash-menu-store";

function newEditor(content: string) {
  return new Editor({
    extensions: articleCanvasExtensions(createSlashMenuStore(), createMediaDialogStore(), createColorMenuStore()),
    content,
  });
}

interface Json {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string }[];
  content?: Json[];
}

function first(editor: Editor): Json {
  return (editor.getJSON().content ?? [])[0] as Json;
}

function textOf(node: Json): string {
  return (node.content ?? []).map((c) => c.text ?? "").join("");
}

function runQuote(editor: Editor) {
  const cmd = BLOCK_COMMANDS.find((c) => c.key === "quote");
  if (!cmd) throw new Error("no quote command");
  cmd.run(editor);
}

describe("Quote edge quotation marks", () => {
  it("strips the marks when a paragraph becomes a Quote", () => {
    const editor = newEditor("<p>“text”</p>");
    runQuote(editor);
    expect(first(editor).type).toBe(DOC_NODE.quote);
    expect(textOf(first(editor))).toBe("text");
  });

  it("converts a subheading to a Quote, keeping its text and stripping marks", () => {
    const editor = newEditor("<h2>“Эцэг эх юуг ажиглах вэ?”</h2>");
    runQuote(editor);
    expect(first(editor).type).toBe(DOC_NODE.quote);
    expect(textOf(first(editor))).toBe("Эцэг эх юуг ажиглах вэ?");
  });

  it("strips edge marks from pasted text", () => {
    for (const [input, expected] of [['"text"', "text"], ["«text»", "text"], ["„text”", "text"]]) {
      const editor = newEditor("<blockquote><p>x</p></blockquote>");
      editor.commands.setTextSelection({ from: 1, to: 2 });
      editor.commands.insertContent(input);
      expect(first(editor).type).toBe(DOC_NODE.quote);
      expect(textOf(first(editor))).toBe(expected);
    }
  });

  it("leaves interior marks untouched", () => {
    const editor = newEditor("<p>a “b” c</p>");
    runQuote(editor);
    expect(textOf(first(editor))).toBe("a “b” c");
  });

  it("keeps bold on the remaining text", () => {
    const editor = newEditor("<p>“<strong>bold</strong>”</p>");
    runQuote(editor);
    const node = first(editor);
    expect(textOf(node)).toBe("bold");
    expect(node.content?.[0]?.marks?.map((m) => m.type)).toContain("bold");
  });

  it("keeps attribution unchanged", () => {
    const editor = newEditor('<blockquote data-attribution="Б. Дорж"><p>“text”</p></blockquote>');
    editor.commands.insertContentAt(1, " ");
    expect(first(editor).attrs?.attribution).toBe("Б. Дорж");
    expect(textOf(first(editor))).toBe("text");
  });

  it("normalizes a stored Quote on its first edit", () => {
    const editor = newEditor("<blockquote><p>“stored”</p></blockquote>");
    expect(textOf(first(editor))).toBe("“stored”");
    editor.commands.insertContentAt(1, " ");
    expect(textOf(first(editor))).toBe("stored");
  });

  it("leaves paragraphs alone", () => {
    const editor = newEditor("<p>“text”</p>");
    editor.commands.insertContentAt(1, " ");
    expect(textOf(first(editor))).toBe(" “text”");
  });

  it("strips every Quote in the doc, not just the first", () => {
    const editor = newEditor("<blockquote><p>“a”</p></blockquote><blockquote><p>«bc»</p></blockquote><p>x</p>");
    editor.commands.insertContentAt(editor.state.doc.content.size - 1, "y");
    const quotes = (editor.getJSON().content ?? []).filter((n) => n.type === DOC_NODE.quote) as Json[];
    expect(quotes.map(textOf)).toEqual(["a", "bc"]);
  });
});

describe("Quote decorative marks and attribution", () => {
  it("never puts drawn quotation marks into the saved Body", () => {
    const editor = newEditor('<blockquote data-attribution="Б. Дорж"><p>text</p></blockquote>');
    expect(textOf(first(editor))).toBe("text");
    expect(editor.getText()).not.toMatch(/[“”]/);
  });

  it("saves an edited attribution", () => {
    const editor = newEditor("<blockquote><p>text</p></blockquote>");
    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(0, undefined, { ...editor.state.doc.child(0).attrs, attribution: "Н. Бат" });
      return true;
    });
    expect(first(editor).attrs?.attribution).toBe("Н. Бат");
  });
});
