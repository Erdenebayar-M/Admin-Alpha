// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { cleanPastedContent } from "./article-paste";

/** Drops line-break whitespace left between tags where removed elements used to be. */
const squash = (html: string) => html.replace(/>\s*\n\s*</g, "><").trim();
const clean = (html: string) => {
  const result = cleanPastedContent(html);
  return { html: squash(result.html), changed: result.changed };
};

describe("cleanPastedContent", () => {
  it("leaves already-supported content alone and reports no change", () => {
    const html = "<h2>Гарчиг</h2><p><strong>тод</strong> <em>налуу</em> <a href=\"https://a.mn\">холбоос</a></p>";
    expect(clean(html)).toEqual({ html, changed: false });
  });

  it("demotes H1 to H2", () => {
    expect(clean("<h1>Гол гарчиг</h1><p>текст</p>")).toEqual({ html: "<h2>Гол гарчиг</h2><p>текст</p>", changed: true });
  });

  it("promotes H4 and deeper to H3", () => {
    expect(clean("<h4>a</h4><h5>b</h5><h6>c</h6>")).toEqual({ html: "<h3>a</h3><h3>b</h3><h3>c</h3>", changed: true });
  });

  it("strips underline, font and colour, keeping the text", () => {
    expect(clean('<p><u>доогуур</u> <font face="Arial" color="red">фонт</font> <span style="color: red">өнгө</span></p>')).toEqual({
      html: "<p>доогуур фонт <span>өнгө</span></p>",
      changed: true,
    });
  });

  it("strips underline and font styles but keeps bold/italic styles Google Docs uses", () => {
    expect(
      clean('<p><span style="font-weight:700;text-decoration:underline;font-family:Arial;font-style:italic">x</span></p>'),
    ).toEqual({ html: '<p><span style="font-weight: 700; font-style: italic;">x</span></p>', changed: true });
  });

  it("flattens a two-level nested list to one level, keeping item order", () => {
    expect(clean("<ul><li>a<ul><li>a1</li><li>a2</li></ul></li><li>b</li></ul>")).toEqual({
      html: "<ul><li>a</li><li>a1</li><li>a2</li><li>b</li></ul>",
      changed: true,
    });
  });

  it("flattens a list nested directly inside another list (Google Docs shape)", () => {
    expect(clean("<ol><li>a</li><ol><li>a1</li></ol><li>b</li></ol>")).toEqual({
      html: "<ol><li>a</li><li>a1</li><li>b</li></ol>",
      changed: true,
    });
  });

  it("flattens three levels deep", () => {
    expect(clean("<ul><li>a<ul><li>b<ul><li>c</li></ul></li></ul></li></ul>")).toEqual({
      html: "<ul><li>a</li><li>b</li><li>c</li></ul>",
      changed: true,
    });
  });

  it("turns a simple table's cells into paragraphs, skipping empty cells", () => {
    expect(
      clean("<table><tbody><tr><th>Нэр</th><th>Утга</th></tr><tr><td>a</td><td> </td></tr></tbody></table><p>дараа</p>"),
    ).toEqual({ html: "<p>Нэр</p><p>Утга</p><p>a</p><p>дараа</p>", changed: true });
  });

  it("keeps the paragraphs a table cell already holds", () => {
    expect(clean("<table><tr><td><p>нэг</p><p>хоёр</p></td></tr></table>")).toEqual({
      html: "<p>нэг</p><p>хоёр</p>",
      changed: true,
    });
  });

  it("keeps every paragraph of a multi-paragraph blockquote, the rest after the quote", () => {
    expect(clean("<blockquote><p>A</p><p>B</p></blockquote>")).toEqual({
      html: "<blockquote><p>A</p></blockquote><p>B</p>",
      changed: true,
    });
  });

  it("leaves a single-paragraph blockquote alone", () => {
    expect(clean("<blockquote><p>A</p></blockquote>")).toEqual({ html: "<blockquote><p>A</p></blockquote>", changed: false });
  });
});
