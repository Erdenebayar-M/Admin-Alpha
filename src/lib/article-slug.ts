/**
 * Client-side Cyrillic→Latin transliteration for Article slugs. Produces a
 * string matching `SLUG_RE` (`^[a-z0-9]+(-[a-z0-9]+)*$`) — or "" when the
 * title has nothing transliterable, which the server rejects as a field error.
 * ө/ү fold to o/u so slugs stay plain ASCII.
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z",
  и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", ө: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
  ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(title: string): string {
  const latin = Array.from(title.toLowerCase(), (ch) => CYRILLIC_TO_LATIN[ch] ?? ch).join("");
  return latin
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
