const STYLE_SUFFIX =
  "Flat vector illustration style. Bright, saturated primary colors. " +
  "Solid white background. Simple bold outlines. No text, no letters, no numbers. " +
  "Child-friendly and clean. Educational material for Mongolian elementary school (grades 1-4). " +
  "Single centered subject, nothing else in frame.";

export function buildImagePrompt(subject: string): string {
  return `${subject.trim()}. ${STYLE_SUFFIX}`;
}
