import { describe, it, expect } from "vitest";
import { transform } from "./utils";

describe("arrow function components", () => {
  it("handles inline JSX return", async () => {
    const input = `
      export const Button = () => <button>Click</button>
    `;
    const result = await transform(input);

    expect(result).toContain("Button.displayName = 'Button'");
  });

  it("handles block with JSX return", async () => {
    const input = `
      const Modal = () => {
        return <div>Modal content</div>
      }
    `;
    const result = await transform(input);
    expect(result).toContain("Modal.displayName = 'Modal'");
  });

  it("handles conditional returns", async () => {
    const input = `
      const ConditionalComponent = ({ show }) => {
        if (show) {
          return <div>Shown</div>
        }
        return <div>Hidden</div>
      }
    `;
    const result = await transform(input);
    expect(result).toContain("ConditionalComponent.displayName = 'ConditionalComponent'");
  });

  it("handles early returns", async () => {
    const input = `
      const EarlyReturn = ({ loading, error, data }) => {
        if (loading) return <div>Loading...</div>
        if (error) return <div>Error: {error}</div>
        return <div>{data}</div>
      }
    `;
    const result = await transform(input);
    expect(result).toContain("EarlyReturn.displayName = 'EarlyReturn'");
  });
});
