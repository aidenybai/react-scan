import { getElementContext } from "react-grab/primitives";

export const copyFocusedElement = async (element: Element): Promise<boolean> => {
  try {
    const context = await getElementContext(element);
    const snippet = `${context.htmlPreview}${context.stackString}`;
    if (!snippet.trim()) return false;
    await navigator.clipboard.writeText(snippet);
    return true;
  } catch {
    return false;
  }
};
