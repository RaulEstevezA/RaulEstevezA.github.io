/**
 * Small helper to build the interface without a framework. Texts always go through text
 * nodes and never through innerHTML, so nothing written by a player, or returned by one
 * of their queries, can become markup.
 */

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** Sets one property: `on*` are listeners, `class` and the rest are attributes. */
function applyProp(element, name, value) {
  if (value === null || value === undefined || value === false) return;
  if (name.startsWith('on') && typeof value === 'function') {
    element.addEventListener(name.slice(2).toLowerCase(), value);
  } else {
    element.setAttribute(name, value === true ? '' : String(value));
  }
}

/** Appends children, skipping empty ones and flattening lists. */
function appendChildren(element, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child);
  }
}

/**
 * Creates an HTML element.
 *
 * @param {string} tag Name of the element.
 * @param {object} [props] Attributes and `on*` listeners. `null` and `false` are skipped.
 * @param {...any} children Text, elements or lists of them.
 * @returns {HTMLElement} The element.
 */
export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(props)) applyProp(element, name, value);
  appendChildren(element, children);
  return element;
}

/**
 * Creates an SVG element.
 *
 * @param {string} tag Name of the element.
 * @param {object} [props] Attributes.
 * @param {...any} children Other SVG elements.
 * @returns {SVGElement} The element.
 */
export function svg(tag, props = {}, ...children) {
  const element = document.createElementNS(SVG_NAMESPACE, tag);
  for (const [name, value] of Object.entries(props)) applyProp(element, name, value);
  appendChildren(element, children);
  return element;
}
