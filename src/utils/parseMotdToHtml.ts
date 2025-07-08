export function parseMotdToHtml(motd: string): string {
  const colorMap: Record<string, string> = {
    '0': '#000000',
    '1': '#0000AA',
    '2': '#00AA00',
    '3': '#00AAAA',
    '4': '#AA0000',
    '5': '#AA00AA',
    '6': '#FFAA00',
    '7': '#AAAAAA',
    '8': '#555555',
    '9': '#5555FF',
    'a': '#55FF55',
    'b': '#55FFFF',
    'c': '#FF5555',
    'd': '#FF55FF',
    'e': '#FFFF55',
    'f': '#FFFFFF',
  };

  const styleMap: Record<string, string> = {
    l: 'font-weight:bold;',
    m: 'text-decoration:line-through;',
    n: 'text-decoration:underline;',
    o: 'font-style:italic;',
    r: '', // reset
  };

  let html = '';
  let currentColor = '';
  let currentStyles: string[] = [];

  const parts = motd.split(/(§.)/);

  for (let part of parts) {
    if (part.startsWith('§')) {
      const code = part[1].toLowerCase();
      if (colorMap[code]) {
        currentColor = `color:${colorMap[code]};`;
      } else if (styleMap[code] !== undefined) {
        if (code === 'r') {
          currentColor = '';
          currentStyles = [];
        } else {
          currentStyles.push(styleMap[code]);
        }
      }
    } else {
      const styles = [currentColor, ...currentStyles].filter(Boolean).join('');
      html += `<span style="${styles}">${escapeHtml(part)}</span>`;
    }
  }

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}
