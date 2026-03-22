function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function buildNoteShareFileStem(title = '') {
  return slugify(title) || 'snipxn-note';
}

export function stripMarkdownToText(content = '') {
  return String(content)
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[\w-]*\r?\n?/g, '').replace(/```/g, ' '))
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1 ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/[*_`~]/g, ' ')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function summarizeNoteShareContent(content = '', maxLength = 280) {
  const plainText = stripMarkdownToText(content);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;

    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      return;
    }

    if (line) {
      lines.push(line);
    }

    line = word;
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

function drawTextBlock(ctx, { text, x, y, maxWidth, lineHeight, maxLines, color, font }) {
  ctx.fillStyle = color;
  ctx.font = font;

  const lines = wrapText(ctx, text, maxWidth).slice(0, maxLines);

  lines.forEach((line, index) => {
    const isLastVisibleLine = index === lines.length - 1;
    const nextText = isLastVisibleLine && lines.length === maxLines ? `${line}…` : line;
    ctx.fillText(nextText, x, y + index * lineHeight);
  });
}

function createCanvas(width, height) {
  const pixelRatio = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 1) : 1;
  const canvas = document.createElement('canvas');
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(pixelRatio, pixelRatio);

  return { canvas, ctx };
}

export async function createNoteShareImageBlob({
  title = '',
  language = '',
  updatedAt = '',
  summary = '',
  brand = 'Snipxn',
}) {
  const width = 1440;
  const height = 900;
  const { canvas, ctx } = createCanvas(width, height);

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#f4f8f7');
  background.addColorStop(1, '#e4efec');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(72, 72, width - 144, height - 144);

  ctx.strokeStyle = '#d6e3df';
  ctx.lineWidth = 2;
  ctx.strokeRect(72, 72, width - 144, height - 144);

  ctx.fillStyle = '#17453f';
  ctx.font = '600 22px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(brand, 110, 130);

  ctx.fillStyle = '#5b6f6b';
  ctx.font = '500 18px "JetBrains Mono", "Cascadia Mono", monospace';
  const meta = [language, updatedAt].filter(Boolean).join('  ·  ');
  if (meta) {
    ctx.fillText(meta, 110, 184);
  }

  drawTextBlock(ctx, {
    text: title || 'Untitled Note',
    x: 110,
    y: 270,
    maxWidth: width - 220,
    lineHeight: 78,
    maxLines: 2,
    color: '#102321',
    font: '700 56px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  });

  ctx.fillStyle = '#dfe9e6';
  ctx.fillRect(110, 330, width - 220, 2);

  drawTextBlock(ctx, {
    text: summary || 'Share your note with a cleaner summary card.',
    x: 110,
    y: 410,
    maxWidth: width - 220,
    lineHeight: 40,
    maxLines: 8,
    color: '#35514b',
    font: '400 28px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  });

  ctx.fillStyle = '#7a908b';
  ctx.font = '500 18px "JetBrains Mono", "Cascadia Mono", monospace';
  ctx.fillText('Generated from Snipxn Workspace', 110, height - 110);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });

  if (!blob) {
    throw new Error('Failed to generate image blob');
  }

  return blob;
}
