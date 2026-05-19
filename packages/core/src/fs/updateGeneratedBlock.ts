export const GENERATED_BLOCK_START = "<!-- contextforge:start -->";
export const GENERATED_BLOCK_END = "<!-- contextforge:end -->";

const blockPattern = new RegExp(
  `${escapeRegExp(GENERATED_BLOCK_START)}[\\s\\S]*?${escapeRegExp(GENERATED_BLOCK_END)}`,
  "m"
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getGeneratedBlock(content: string): string | null {
  return content.match(blockPattern)?.[0] ?? null;
}

export function wrapGeneratedBlock(content: string): string {
  return `${GENERATED_BLOCK_START}\n${content.trim()}\n${GENERATED_BLOCK_END}`;
}

export function updateGeneratedBlock(existingContent: string | null, generatedContent: string): string {
  const existing = existingContent?.replace(/\s+$/u, "") ?? "";
  const generatedBlock = getGeneratedBlock(generatedContent) ?? wrapGeneratedBlock(generatedContent);

  if (!existing) {
    return `${generatedContent.includes(GENERATED_BLOCK_START) ? generatedContent.trim() : generatedBlock}\n`;
  }

  if (blockPattern.test(existing)) {
    return `${existing.replace(blockPattern, generatedBlock)}\n`;
  }

  return `${existing}\n\n${generatedBlock}\n`;
}
