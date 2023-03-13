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
