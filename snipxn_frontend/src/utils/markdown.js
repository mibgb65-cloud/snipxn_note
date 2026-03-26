function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const CODE_LANGUAGE_LABELS = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  ruby: 'Ruby',
  php: 'PHP',
  java: 'Java',
  kt: 'Kotlin',
  kotlin: 'Kotlin',
  swift: 'Swift',
  go: 'Go',
  rs: 'Rust',
  rust: 'Rust',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  cs: 'C#',
  csharp: 'C#',
  'c#': 'C#',
  sh: 'Shell',
  shell: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  sql: 'SQL',
  html: 'HTML',
  xml: 'XML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  ini: 'INI',
  md: 'Markdown',
  markdown: 'Markdown',
  vue: 'Vue',
  dockerfile: 'Dockerfile',
  plaintext: 'Plain text',
  text: 'Plain text',
};

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

function extractCodeLanguage(fenceLine = '') {
  return String(fenceLine || '')
    .slice(3)
    .trim()
    .split(/\s+/)[0] || '';
}

function formatCodeLanguageLabel(language = '', fallbackLabel = 'Plain text') {
  const normalized = String(language || '').trim().toLowerCase();

  if (!normalized) {
    return fallbackLabel;
  }

  if (CODE_LANGUAGE_LABELS[normalized]) {
    return CODE_LANGUAGE_LABELS[normalized];
  }

  if (/^[a-z]{1,4}$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  return normalized
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

async function copyTextToClipboard(value = '') {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard is unavailable');
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'readonly');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Clipboard copy failed');
  }
}

export function bindMarkdownCodeActions(container, options = {}) {
  if (!container || typeof container.addEventListener !== 'function') {
    return () => {};
  }

  const copyButtonLabel = String(options.copyButtonLabel || 'Copy');
  const copiedButtonLabel = String(options.copiedButtonLabel || 'Copied');
  const resetDelay = Number(options.resetDelay || 1800);

  const resetButtonState = (button) => {
    if (!button) {
      return;
    }

    const activeTimerId = Number(button.dataset.resetTimerId || 0);

    if (activeTimerId && typeof window !== 'undefined') {
      window.clearTimeout(activeTimerId);
    }

    button.textContent = copyButtonLabel;
    button.dataset.copied = 'false';
    delete button.dataset.resetTimerId;
  };

  const handleClick = async (event) => {
    const trigger = event.target instanceof Element
      ? event.target.closest('.markdown-code-copy')
      : null;

    if (!trigger || !container.contains(trigger)) {
      return;
    }

    const codeElement = trigger.closest('.markdown-code-block')?.querySelector('pre code');

    if (!codeElement) {
      return;
    }

    try {
      await copyTextToClipboard(codeElement.textContent || '');
      resetButtonState(trigger);
      trigger.textContent = copiedButtonLabel;
      trigger.dataset.copied = 'true';

      if (typeof window !== 'undefined') {
        const timerId = window.setTimeout(() => {
          if (trigger.isConnected) {
            resetButtonState(trigger);
          }
        }, resetDelay);

        trigger.dataset.resetTimerId = String(timerId);
      }

      options.onCopySuccess?.();
    } catch (error) {
      resetButtonState(trigger);
      options.onCopyError?.(error);
    }
  };

  container.addEventListener('click', handleClick);

  return () => {
    container.removeEventListener('click', handleClick);

    container.querySelectorAll('.markdown-code-copy').forEach((button) => {
      resetButtonState(button);
    });
  };
}

export function renderMarkdown(source = '', options = {}) {
  const enhancedCodeBlocks = Boolean(options.enhancedCodeBlocks);
  const copyButtonLabel = escapeHtml(options.copyButtonLabel || 'Copy');
  const defaultCodeLanguageLabel = options.defaultCodeLanguageLabel || 'Plain text';
  const lines = source.split(/\r?\n/);
  const html = [];
  let inCodeBlock = false;
  let inList = false;
  let codeBuffer = [];
  let codeLanguage = '';

  const flushCodeBlock = () => {
    if (!codeBuffer.length) {
      return;
    }

    const escapedCode = escapeHtml(codeBuffer.join('\n'));

    if (enhancedCodeBlocks) {
      const languageLabel = escapeHtml(formatCodeLanguageLabel(codeLanguage, defaultCodeLanguageLabel));

      html.push(`
        <div class="markdown-code-block">
          <div class="markdown-code-toolbar">
            <span class="markdown-code-language">${languageLabel}</span>
            <button type="button" class="markdown-code-copy" data-copied="false" aria-label="${copyButtonLabel}">
              ${copyButtonLabel}
            </button>
          </div>
          <pre><code>${escapedCode}</code></pre>
        </div>
      `.trim());
    } else {
      html.push(`<pre><code>${escapedCode}</code></pre>`);
    }

    codeBuffer = [];
    codeLanguage = '';
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
        codeLanguage = extractCodeLanguage(line);
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
