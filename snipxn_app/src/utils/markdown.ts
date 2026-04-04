const MAX_SUMMARY_LENGTH = 200;

function stripMarkdown(content: string): string {
  return content
    .replace(/\r\n?/g, '\n')
    .replace(/```[\s\S]*?```/g, block =>
      block.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, ''),
    )
    .replace(/~~~[\s\S]*?~~~/g, block =>
      block.replace(/^~~~[^\n]*\n?/, '').replace(/\n?~~~$/, ''),
    )
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*[-:| ]{3,}\s*$/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSummary(content: string): string {
  const plainText = stripMarkdown(content);

  return Array.from(plainText).slice(0, MAX_SUMMARY_LENGTH).join('');
}
