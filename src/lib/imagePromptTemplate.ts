// The backend IMAGE_STYLE_SYSTEM (content.ts) owns all style/composition rules.
// Here we only pass the clean subject (usually a Mongolian word) for Gemini to depict.
export function buildImagePrompt(subject: string): string {
  return subject.trim();
}
