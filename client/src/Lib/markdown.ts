/**
 * Lightweight markdown → HTML renderer (no external deps)
 * Handles: headings, bold, italic, code blocks, inline code, blockquote,
 *          hr, links, images, unordered/ordered lists, paragraphs.
 */
export function renderMarkdown(md: string): string {
  if (!md) return '';
  let html = md
    // escape HTML entities first
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // headings
    .replace(/^#{4} (.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3} (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // fenced code blocks (before inline)
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_m, c) => `<pre><code>${c.trim()}</code></pre>`)
    // inline bold / italic / code
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // blockquote
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    // hr
    .replace(/^---$/gm, '<hr/>')
    // links and images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1"/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li data-ol>$1</li>')
    // unordered list items
    .replace(/^[-*+] (.+)$/gm, '<li>$1</li>');

  // wrap consecutive <li> into <ul> or <ol>
  html = html.replace(/(<li data-ol>.*?<\/li>)(\n<li data-ol>.*?<\/li>)*/gs, (m) =>
    '<ol>' + m.replace(/ data-ol/g, '') + '</ol>'
  );
  html = html.replace(/(<li>(?!.*<\/ol>).*?<\/li>)(\n<li>.*?<\/li>)*/gs, (m) =>
    m.startsWith('<ol>') ? m : '<ul>' + m + '</ul>'
  );

  // paragraphs — lines that are not already block elements
  const blockEl = /^<(h[1-6]|pre|ul|ol|li|blockquote|hr|img|div|p)/;
  html = html
    .split('\n')
    .map(line => {
      if (!line.trim()) return '';
      if (blockEl.test(line)) return line;
      return `<p>${line}</p>`;
    })
    .filter(l => l !== '')
    .join('\n');

  return html;
}

/**
 * Format ISO date string to Indonesian locale
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
