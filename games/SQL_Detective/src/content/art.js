/**
 * Illustrations of the game. Until an illustration exists, its screen shows the skyline
 * drawn by `ui/art/skyline.js`, so the game never requests a missing file.
 *
 * To add one, save it in `public/art/` and add its name to `DELIVERED_ART`.
 */

/** Names (without extension) of the illustrations present in `public/art/`. */
const DELIVERED_ART = [
  'chapter-1',
  'chapter-2',
  'chapter-3',
  'chapter-4',
  'chapter-5',
  'ending-press',
  'ending-arrest',
  'ending-deal',
];

/**
 * Finds an illustration.
 *
 * @param {string} name Such as `chapter-1` or `ending-press`.
 * @returns {string|null} Its address, or `null` while it does not exist.
 */
export function artUrl(name) {
  return DELIVERED_ART.includes(name) ? `./art/${name}.webp` : null;
}
