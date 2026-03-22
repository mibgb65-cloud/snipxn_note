function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitizeUrl(url) {
  const decoded = url.replace(/&amp;/g, '&');
  const trimmed = decoded.trim().toLowerCase();

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('/')
  ) {
    return url;
  }

  return '';
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) =>
      `<img src="${sanitizeUrl(src)}" alt="${alt}" />`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
      `<a href="${sanitizeUrl(href)}" target="_blank" rel="noreferrer">${label}</a>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export function renderMarkdown(source = '') {
  const lines = source.split(/\r?\n/);
  const html = [];
  let inCodeBlock = false;
  let inList = false;
  let codeBuffer = [];

  const flushCodeBlock = () => {
    if (!codeBuffer.length) {
      return;
    }

    html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
    codeBuffer = [];
  };

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  lines.forEach((line) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        closeList();
        inCodeBlock = true;
      }

      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }

      html.push(`<li>${renderInline(trimmed.replace(/^[-*]\s+/, ''))}</li>`);
      return;
    }

    closeList();

    if (/^#{1,6}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)[0].length;
      html.push(`<h${level}>${renderInline(trimmed.slice(level).trim())}</h${level}>`);
      return;
    }

    if (trimmed.startsWith('>')) {
      html.push(`<blockquote>${renderInline(trimmed.replace(/^>\s?/, ''))}</blockquote>`);
      return;
    }

    if (trimmed === '---') {
      html.push('<hr />');
      return;
    }

    html.push(`<p>${renderInline(trimmed)}</p>`);
  });

  flushCodeBlock();
  closeList();

  return html.join('');
}
