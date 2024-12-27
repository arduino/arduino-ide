import { notEmpty } from '@theia/core/lib/common/objects';

/**
 * Finds the closest child HTMLButtonElement representing a Theia button.
 * A button is a Theia button if it's a `<button>` element and has the `"theia-button"` class.
 * If an element has multiple Theia button children, this function prefers `"main"` over `"secondary"` button.
 */
export function findChildTheiaButton(
  element: HTMLElement,
  recursive = false
): HTMLButtonElement | undefined {
  let button: HTMLButtonElement | undefined = undefined;
  const children = Array.from(element.children);
  for (const child of children) {
    if (
      child instanceof HTMLButtonElement &&
      child.classList.contains('theia-button')
    ) {
      if (child.classList.contains('main')) {
        return child;
      }
      button = child;
    }
  }
  if (!button && recursive) {
    button = children
      .filter(isHTMLElement)
      .map((childElement) => findChildTheiaButton(childElement, true))
      .filter(notEmpty)
      .shift();
  }
  return button;
}

function isHTMLElement(element: Element): element is HTMLElement {
  return element instanceof HTMLElement;
}

type Segment = string | { textContent: string; bold: true };
/**
 * Returns with an array of `Segments` by splitting raw HTML text on the `<b></b>` groups. If splitting is not possible, returns `undefined`.
 * Example: `one<b>two</b>three<b>four</b>five` will provide an five element length array. Where the 1<sup>st</sup> and 3<sup>rd</sup> elements are objects and the rest are string.
 */
export function splitByBoldTag(text: string): Segment[] | undefined {
  const matches = text.matchAll(new RegExp(/<\s*b[^>]*>(.*?)<\s*\/\s*b>/gm));
  if (!matches) {
    return undefined;
  }
  const segments: Segment[] = [];
  const textLength = text.length;
  let processedLength = 0;
  for (const match of matches) {
    const { index } = match;
    if (typeof index === 'number') {
      if (!segments.length && index) {
        segments.push(text.substring(0, index));
      }
      if (processedLength > 0) {
        segments.push(text.substring(processedLength, index));
      }
      segments.push({ textContent: match[1], bold: true });
      processedLength = index + match[0].length;
    }
  }
  if (segments.length && textLength > processedLength) {
    segments.push(text.substring(processedLength));
  }
  return segments.length ? segments : undefined;
}
