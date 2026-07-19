import { describe, it, expect } from "vitest";
import { transform } from "./utils";

describe("function declarations", () => {
  it("handles named function declarations", async () => {
    const input = `
      function Welcome(props) {
        return <h1>Hello, {props.name}</h1>
      }
    `;
    const result = await transform(input);
    expect(result).toContain("Welcome.displayName = 'Welcome'");
  });

  it("handles async components", async () => {
    const input = `
      async function AsyncComponent({ id }) {
        const data = await fetchData(id)
        return <div>{data}</div>
      }
    `;
    const result = await transform(input);
    expect(result).toContain("AsyncComponent.displayName = 'AsyncComponent'");
  });
});
