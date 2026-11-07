/**
 * The city of Puerto Ceniza, drawn with the same blocks as the logo of the game: buildings
 * made of data cells in shades of blue, with a few windows lit in the amber of its one
 * highlighted cell. The drawing is deterministic: each seed is always the same skyline,
 * so that each chapter has its own.
 */

import { createRandom } from '../../content/world/noise.js';
import { svg } from '../dom.js';

const WIDTH = 480;
const HEIGHT = 200;
const CELL = 6;
const GAP = 2;

/** Picks the look of a window. Most stay dark, which is what makes the lit ones read. */
function windowClass(random) {
  const roll = random.int(0, 99);
  if (roll < 2) return 'skyline__cell skyline__cell--amber';
  if (roll < 14) return 'skyline__cell skyline__cell--bright';
  if (roll < 40) return 'skyline__cell skyline__cell--mid';
  return 'skyline__cell';
}

/** Draws one building as a column of cells. */
function building(random, x, columns, rows) {
  const cells = [];
  const width = columns * (CELL + GAP);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      cells.push(
        svg('rect', {
          class: windowClass(random),
          x: x + column * (CELL + GAP),
          y: HEIGHT - (row + 1) * (CELL + GAP),
          width: CELL,
          height: CELL,
        }),
      );
    }
  }
  return { cells, width };
}

/**
 * Draws a skyline.
 *
 * @param {number} seed Chooses the skyline; the same seed gives the same drawing.
 * @param {{tall?: boolean}} [options] `tall` makes the buildings taller, for the main menu.
 * @returns {SVGElement} A decorative drawing, hidden from assistive technology.
 */
export function createSkyline(seed, { tall = false } = {}) {
  const random = createRandom(seed);
  const maximumRows = tall ? 22 : 15;
  const cells = [];
  let x = -4;
  while (x < WIDTH) {
    const columns = random.int(3, 8);
    const rows = random.int(5, maximumRows);
    const block = building(random, x, columns, rows);
    cells.push(block.cells);
    x += block.width + random.int(2, 12);
  }
  return svg(
    'svg',
    {
      class: 'skyline',
      viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
      preserveAspectRatio: 'xMidYMax slice',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    cells,
  );
}
