// Backend sends this to Gemini 2.5 Flash which rewrites it into a full image prompt.
// The hint steers Gemini toward isolated icons rather than scene compositions.
export function buildImagePrompt(subject: string): string {
  return `${subject.trim()} — isolated object, educational flashcard icon for children`;
}
