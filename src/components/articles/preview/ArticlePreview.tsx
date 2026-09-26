import { Link2 } from "lucide-react";
import { colorCss, tintCss } from "@/lib/article-colors";
import { cn } from "@/lib/utils";
import type { ArticleBlock, CalloutBlock, ColorValue, HeadingBlock, ImageBlock, InlineSpan, LinkCardBlock, ListBlock, ParagraphBlock, QuoteBlock, VideoBlock } from "@/lib/article-types";
import { alignmentClass } from "./alignment";
import { SITE_CLASS, SITE_FONT_CLASS, SITE_SURFACE_HEX, SITE_SURFACE_STYLE } from "../site-look";

const BODY_TEXT_CLASS = SITE_CLASS.body;
const HEADING_TEXT_CLASS = SITE_CLASS.heading;
const MUTED_TEXT_CLASS = SITE_CLASS.muted;

// A click never navigates the admin tab away — this is a read-only preview, not a real
// page, the same intent as the canvas's own Tiptap Link mark (`openOnClick: false`).
function preventNavigation(e: React.MouseEvent) {
  e.preventDefault();
}

function Span({ span }: { span: InlineSpan }) {
  const weight = cn(span.bold && "font-bold", span.italic && "italic");
  if (span.href) {
    return (
      <a
        href={span.href}
        onClick={preventNavigation}
        className={cn(weight, SITE_CLASS.link)}
      >
        {span.text}
      </a>
    );
  }
  const style: { color?: string; backgroundColor?: string } = {};
  if (span.color) style.color = colorCss(span.color);
  if (span.highlight) style.backgroundColor = tintCss(span.highlight);
  if (weight || span.color || span.highlight) {
    return (
      <span className={cn(weight, span.highlight && "rounded px-0.5")} style={style}>
        {span.text}
      </span>
    );
  }
  return <>{span.text}</>;
}

function backgroundStyle(background: ColorValue | undefined): { backgroundColor: string } | undefined {
  return background ? { backgroundColor: tintCss(background) } : undefined;
}

function InlineSpans({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((span, index) => (
        <Span key={`${index}-${span.text}`} span={span} />
      ))}
    </>
  );
}

function Paragraph({ block }: { block: ParagraphBlock }) {
  return (
    <p
      className={cn(BODY_TEXT_CLASS, alignmentClass(block.alignment), block.background && "rounded-2xl px-4 py-3")}
      style={backgroundStyle(block.background)}
    >
      <InlineSpans spans={block.content} />
    </p>
  );
}

function Heading({ block }: { block: HeadingBlock }) {
  const Tag = block.level === 2 ? "h2" : "h3";
  return (
    <Tag
      className={cn(
        HEADING_TEXT_CLASS,
        block.level === 2 ? "text-2xl" : "text-xl",
        alignmentClass(block.alignment),
        block.background && "rounded-2xl px-4 py-3",
      )}
      style={{ ...(block.color ? { color: colorCss(block.color) } : {}), ...backgroundStyle(block.background) }}
    >
      {block.text}
    </Tag>
  );
}

// A List's Marker (ADR 0005) is rendered by us, not the browser's native
// `::marker` — its glyph/number is always computed from position, never
// stored. Rendering it as ordinary inline content ahead of the item's text
// (instead of a `::marker` box) is also what makes it move with `alignment`.
function markerGlyph(style: ListBlock["style"], index: number, startsAt: number | undefined): string {
  return style === "bullet" ? "•" : `${(startsAt ?? 1) + index}.`;
}

function List({ block }: { block: ListBlock }) {
  const Tag = block.style === "ordered" ? "ol" : "ul";
  return (
    <Tag
      start={block.startsAt}
      className={cn(
        BODY_TEXT_CLASS,
        "flex flex-col gap-2 pl-6 list-none",
        alignmentClass(block.alignment),
        block.background && "rounded-2xl px-4 py-3",
      )}
      style={backgroundStyle(block.background)}
    >
      {block.items.map((item, index) => (
        <li key={index}>
          <span
            className="mr-2 select-none"
            style={item.markerColor ? { color: colorCss(item.markerColor) } : undefined}
          >
            {markerGlyph(block.style, index, block.startsAt)}
          </span>
          <InlineSpans spans={item.spans} />
        </li>
      ))}
    </Tag>
  );
}

function Quote({ block }: { block: QuoteBlock }) {
  return (
    <blockquote
      className={cn(
        BODY_TEXT_CLASS,
        SITE_CLASS.quote,
        alignmentClass(block.alignment),
        block.background && "rounded-2xl py-3 pr-4",
      )}
      style={backgroundStyle(block.background)}
    >
      <p>
        <InlineSpans spans={block.content} />
      </p>
      {block.attribution && <footer className={cn("mt-2 text-sm not-italic", MUTED_TEXT_CLASS)}>— {block.attribution}</footer>}
    </blockquote>
  );
}

function Callout({ block }: { block: CalloutBlock }) {
  const style: { backgroundColor: string; borderColor?: string } = block.background
    ? { backgroundColor: tintCss(block.background), borderColor: colorCss(block.background) }
    : { backgroundColor: SITE_SURFACE_HEX };
  return (
    <div
      role="note"
      className={cn(BODY_TEXT_CLASS, SITE_CLASS.callout, alignmentClass(block.alignment))}
      style={style}
    >
      <InlineSpans spans={block.content} />
    </div>
  );
}

function Divider() {
  return <hr className={SITE_CLASS.divider} />;
}

function ImageBlockView({ block }: { block: ImageBlock }) {
  return (
    <figure className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- R2 asset of arbitrary origin/size, matching the site's own rendering */}
      <img src={block.url} alt={block.alt} className="h-auto w-full rounded-2xl object-cover" />
      {block.caption && <figcaption className={cn("text-sm", MUTED_TEXT_CLASS)}>{block.caption}</figcaption>}
    </figure>
  );
}

// Mirrors `Alpha/web/components/article/ArticleBody.tsx`'s VIDEO_EMBED_SRC exactly.
const VIDEO_EMBED_SRC: Record<VideoBlock["provider"], (id: string) => string> = {
  youtube: (id) => `https://www.youtube-nocookie.com/embed/${id}`,
  vimeo: (id) => `https://player.vimeo.com/video/${id}`,
};

function VideoBlockView({ block }: { block: VideoBlock }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl">
      <iframe
        src={VIDEO_EMBED_SRC[block.provider](block.video_id)}
        title="Дэлгэцлэсэн видео"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

function LinkCardView({ block }: { block: LinkCardBlock }) {
  return (
    <a
      href={block.url}
      onClick={preventNavigation}
      className={SITE_CLASS.linkCard}
    >
      {block.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- R2 asset of arbitrary origin/size, matching the site's own rendering
        <img src={block.image.url} alt={block.image.alt} className="h-20 w-28 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className={SITE_CLASS.linkCardPlaceholder}>
          <Link2 className={cn("size-5", MUTED_TEXT_CLASS)} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className={SITE_CLASS.linkCardTitle}>{block.title}</p>
        {block.description && <p className={cn("text-sm", MUTED_TEXT_CLASS)}>{block.description}</p>}
        <p className={cn("text-xs", MUTED_TEXT_CLASS)}>{block.url}</p>
      </div>
    </a>
  );
}

function BlockView({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "paragraph":
      return <Paragraph block={block} />;
    case "heading":
      return <Heading block={block} />;
    case "list":
      return <List block={block} />;
    case "quote":
      return <Quote block={block} />;
    case "callout":
      return <Callout block={block} />;
    case "divider":
      return <Divider />;
    case "image":
      return <ImageBlockView block={block} />;
    case "video":
      return <VideoBlockView block={block} />;
    case "link_card":
      return <LinkCardView block={block} />;
    default: {
      // Not reachable for data this admin's own canvas produced — a TS exhaustiveness
      // check, not a runtime guarantee. article-types.ts is a hand-kept mirror of the
      // backend's Block union (see its own header comment), so a Block kind the backend
      // added after this file was last synced must render as a stub, not crash the tab.
      const exhaustive: never = block;
      const type = (exhaustive as ArticleBlock).type;
      return <p className={cn("text-sm italic", MUTED_TEXT_CLASS)}>Тодорхойгүй блок: {type}</p>;
    }
  }
}

/**
 * Read-only render of the current (possibly-unsaved) Body, styled with the
 * site's own Nunito font and navy text colours — the reference the site's
 * own reading page (future work) is expected to match. Renders straight from
 * the in-memory Block array the canvas already holds; no backend call.
 *
 * Surface is hardcoded white, independent of the admin panel's own
 * light/dark theme: the site itself has no dark mode for these colours, so a
 * dark admin theme must not carry into this one surface meant to preview it.
 */
export function ArticlePreview({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div
      className={cn(SITE_FONT_CLASS, "min-h-80 rounded-xl border border-border bg-white px-6 py-5")}
      style={SITE_SURFACE_STYLE}
    >
      {blocks.length === 0 ? (
        <p className={cn("text-sm italic", MUTED_TEXT_CLASS)}>Агуулга хоосон байна.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {blocks.map((block) => (
            <BlockView key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}
