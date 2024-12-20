interface TemplateState<T extends HTMLElement> {
  node: T | undefined;
  html: string;
  isSVG: boolean;
}

function template<T extends HTMLElement>(this: TemplateState<T>): T {
  if (!this.node) {
    const t = document.createElement('template');
    t.innerHTML = this.html;
    this.node = (
      this.isSVG ? t.content.firstChild!.firstChild : t.content.firstChild
    ) as T;
  }
  return this.node.cloneNode(true) as T;
}

export function createHTMLTemplate<T extends HTMLElement>(
  html: string,
  isSVG: boolean,
): () => T {
  return (template<T>).bind({
    node: undefined,
    html,
    isSVG,
  } as TemplateState<T>);
}
