export const escapeHtml=value=>String(value??'')
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'",'&#039;');

export function starsMarkup(rating){
  return `<span class="stars" aria-hidden="true"><span>${'★'.repeat(rating)}</span>${'☆'.repeat(5-rating)}</span>`;
}
