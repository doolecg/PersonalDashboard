// Flatten common Markdown into plain text. The dashboard renders AI replies as
// raw text (no Markdown renderer), so without this users see literal **bold**,
// `code`, and `- ` markers. Belt-and-braces alongside the plain-text system
// prompts; some models emit Markdown regardless of instructions.
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, "$1") // fenced code blocks
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold **
    .replace(/__([^_]+)__/g, "$1") // bold __
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2") // italic *
    .replace(/(^|[^_])_([^_\n]+)_/g, "$1$2") // italic _
    .replace(/~~([^~]+)~~/g, "$1") // strikethrough
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links -> text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "") // unordered list markers
    .replace(/^\s*\d+\.\s+/gm, "") // ordered list markers
    // Strip wrapping punctuation so dashboard replies read like a person talking,
    // not quoted/annotated data: remove straight & curly double quotes and parentheses.
    .replace(/[""""]/g, "")
    .replace(/[()（）]/g, "")
    .replace(/[ \t]{2,}/g, " ") // tidy any double spaces left behind
    .trim();
}
