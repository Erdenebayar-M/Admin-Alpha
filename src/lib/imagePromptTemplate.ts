export function buildImagePrompt(subject: string): string {
  const s = subject.trim();
  return (
    `A single ${s}, isolated flat vector illustration. ` +
    `Pure white background only. ` +
    `Absolutely no sky, no ground, no grass, no nature, no scenery, no environment — nothing except the object. ` +
    `Bright saturated primary colors. Bold simple outlines. ` +
    `No text, no letters, no numbers. ` +
    `Child-friendly, centered composition. ` +
    `Educational icon for Mongolian elementary school (grades 1–4). ` +
    `May reflect Mongolian cultural context where relevant (traditional objects, clothing, daily life).`
  );
}
