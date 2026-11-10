// The element at a position in a list, failing the test clearly if there isn't one
export function nth(elements: HTMLElement[], index: number): HTMLElement {
  const element = elements[index];

  if (!element)
    throw new Error(`Expected at least ${index + 1} elements, found ${elements.length}`);

  return element;
}
