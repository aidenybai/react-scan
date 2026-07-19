import { describe, it, expect } from "vitest";
import { transform } from "./utils";

describe("typescript patterns", () => {
  it("handles components with type parameters", async () => {
    const input = `
      interface Props<T> {
        items: T[]
        renderItem: (item: T) => React.ReactNode
      }

      const List = <T extends unknown>({ items, renderItem }: Props<T>) => {
        return <div>{items.map(renderItem)}</div>
      }
    `;
    const result = await transform(input);
    expect(result).toContain("List.displayName = 'List'");
  });

  it("handles components with complex types", async () => {
    const input = `
      type Props = {
        id: string
        onClick: (e: React.MouseEvent) => void
        children: React.ReactNode
      } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>

      export const Button: React.FC<Props> = ({ id, onClick, children, ...rest }) => {
        return <button onClick={onClick} {...rest}>{children}</button>
      }
    `;
    const result = await transform(input);
    expect(result).toContain("Button.displayName = 'Button'");
  });
});
