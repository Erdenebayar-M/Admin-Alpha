import { Nunito } from "next/font/google";
import { Link2 } from "lucide-react";
import { colorCss, tintCss } from "@/lib/article-colors";
import { cn } from "@/lib/utils";
import type { ArticleBlock, CalloutBlock, ColorValue, HeadingBlock, ImageBlock, InlineSpan, LinkCardBlock, ListBlock, ParagraphBlock, QuoteBlock, VideoBlock } from "@/lib/article-types";
import { alignmentClass } from "./alignment";

// Same font + subsets as `Alpha/web/app/layout.tsx` — full Cyrillic Extended
// coverage so Өө/Үү render correctly. Loaded only here (not the admin app's
// own `layout.tsx`), since this is the one surface meant to look like the
// site rather than the admin panel.
const nunito = Nunito({
  variable: "--font-nunito-preview",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

// Hex values copied from `Alpha/web/app/globals.css`'s `@theme` tokens
// (color-text-nav-strong, color-text-navy, color-text-nav, color-brand-blue,
// color-border-card, color-border-soft, color-surface-page,
// color-article-title) — this repo can't import that file or its Tailwind
// config, so the values are mirrored by hand for this one read-only surface.
const BODY_TEXT_CLASS = "text-base leading-relaxed text-[#101828]";
const HEADING_TEXT_CLASS = "font-extrabold text-[#24428f]";
const MUTED_TEXT_CLASS = "text-[#667085]";

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
        className={cn(weight, "text-[#2f5be4] underline underline-offset-2")}
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

function List({ block }: { block: ListBlock }) {
  const Tag = block.style === "ordered" ? "ol" : "ul";
  return (
    <Tag
      className={cn(
        BODY_TEXT_CLASS,
        "flex flex-col gap-2 pl-6",
        block.style === "ordered" ? "list-decimal" : "list-disc",
        alignmentClass(block.alignment),
        block.background && "rounded-2xl px-4 py-3",
      )}
      style={backgroundStyle(block.background)}
    >
      {block.items.map((item, index) => (
        <li key={index}>
          <InlineSpans spans={item} />
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
        "border-l-4 border-[#e4e7ec] pl-4 italic",
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
    : { backgroundColor: "#f7f9fc" };
  return (
    <div
      role="note"
      className={cn(BODY_TEXT_CLASS, "rounded-2xl border border-[#e8eef7] px-5 py-4", alignmentClass(block.alignment))}
      style={style}
    >
      <InlineSpans spans={block.content} />
    </div>
  );
}

function Divider() {
  return <hr className="border-[#e4e7ec]" />;
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
      className="flex gap-4 rounded-2xl border border-[#e4e7ec] p-4 transition-colors hover:bg-[#f7f9fc]"
    >
      {block.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- R2 asset of arbitrary origin/size, matching the site's own rendering
        <img src={block.image.url} alt={block.image.alt} className="h-20 w-28 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-[#f7f9fc]">
          <Link2 className={cn("size-5", MUTED_TEXT_CLASS)} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="font-bold text-[#0f1f4d]">{block.title}</p>
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
      className={cn(nunito.variable, "min-h-80 rounded-xl border border-border bg-white px-6 py-5")}
      style={{ fontFamily: "var(--font-nunito-preview), sans-serif" }}
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
