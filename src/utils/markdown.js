export function parseMarkdown(markdown) {
  if (!markdown) return '';

  let html = markdown;

  const codeBlocks = [];
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
    return placeholder;
  });

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {

    if (url && url.trim()) {
      const cleanUrl = url.trim();
      const cleanAlt = (alt || '').trim();
      return `<img src="${cleanUrl}" alt="${cleanAlt}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 1rem 0; display: block;" onerror="this.style.display='none'; this.outerHTML='<p style=\\'color: #868e96; font-style: italic; padding: 1rem;\\'>이미지를 불러올 수 없습니다</p>';" />`;
    }
    return match;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    
    if (line.includes('__CODE_BLOCK_') || trimmed.startsWith('<')) {
      return line;
    }
    
    if (/^####\s*(.+)$/.test(trimmed)) {
      const match = trimmed.match(/^####\s*(.+)$/);
      return match ? `<h4>${match[1]}</h4>` : line;
    }

    if (/^###\s*(.+)$/.test(trimmed)) {
      const match = trimmed.match(/^###\s*(.+)$/);
      return match ? `<h3>${match[1]}</h3>` : line;
    }

    if (/^##\s*(.+)$/.test(trimmed)) {
      const match = trimmed.match(/^##\s*(.+)$/);
      return match ? `<h2>${match[1]}</h2>` : line;
    }

    if (/^#\s*(.+)$/.test(trimmed)) {
      const match = trimmed.match(/^#\s*(.+)$/);
      return match ? `<h1>${match[1]}</h1>` : line;
    }
    
    return line;
  }).join('\n');

  html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');

  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });

  const lines = html.split('\n');
  let result = [];
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      continue;
    }

    if (line.startsWith('<')) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      result.push(line);
    } else {

      if (!inParagraph) {
        result.push('<p>');
        inParagraph = true;
      }
      result.push(line);
    }
  }

  if (inParagraph) {
    result.push('</p>');
  }

  html = result.join('\n');

  return html || '<p></p>';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
