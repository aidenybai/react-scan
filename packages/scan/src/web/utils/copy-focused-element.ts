import { getElementContext } from "react-grab/primitives";

export const copyFocusedElement = async (element: Element): Promise<boolean> => {
  const context = await getElementContext(element);
  const snippet = `${context.htmlPreview}${context.stackString}`;
  if (!snippet.trim()) return false;

  try {
    await navigator.clipboard.writeText(snippet);
    return true;
  } catch {
    return false;
  }
};
