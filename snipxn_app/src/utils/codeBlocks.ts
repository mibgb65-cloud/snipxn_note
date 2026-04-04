export interface CodeBlock {
  language: string;
  code: string;
  startLine: number;
  endLine: number;
}

/**
 * Extract fenced code blocks from markdown content.
 * For non-markdown documents, returns the entire content as a single block.
 */
export function extractCodeBlocks(content: string, docLanguage: string): CodeBlock[] {
  const normalizedLanguage = docLanguage.trim().toLowerCase() || 'markdown';

  if (normalizedLanguage !== 'markdown') {
    if (content.trim().length === 0) {
      return [];
    }

    return [
      {
        language: normalizedLanguage,
        code: content,
        startLine: 1,
        endLine: content.split('\n').length,
      },
    ];
  }

  const blocks: CodeBlock[] = [];
  const lines = content.split('\n');
  let insideBlock = false;
  let blockLanguage = '';
  let blockLines: string[] = [];
  let blockStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    if (!insideBlock) {
      const openMatch = line.match(/^```(\w*)\s*$/);
      if (openMatch) {
        insideBlock = true;
        blockLanguage = openMatch[1] || 'plaintext';
        blockLines = [];
        blockStartLine = lineNumber;
      }
    } else {
      if (/^```\s*$/.test(line)) {
        blocks.push({
          language: blockLanguage,
          code: blockLines.join('\n'),
          startLine: blockStartLine,
          endLine: lineNumber,
        });
        insideBlock = false;
        blockLanguage = '';
        blockLines = [];
      } else {
        blockLines.push(line);
      }
    }
  }

  return blocks;
}
