import { afterEach, describe, expect, it, vi } from "vitest";
import * as packageExports from "../index";
import * as rscExports from "../rsc-shim";
import { ReactScanInternals, Store, getOptions, getReport, setOptions } from "./index";

const initialOptions = ReactScanInternals.options.value;
const initialInspectState = Store.inspectState.value;
const internalNativeExportNames = [
  "getInspectState",
  "setInspectState",
  "getLastReportTime",
  "setLastReportTime",
  "getIsInIframe",
  "getOptionsState",
  "setOptionsState",
];

afterEach(() => {
  ReactScanInternals.options.value = initialOptions;
  Store.inspectState.value = initialInspectState;
});

describe("public compatibility state", () => {
  it("keeps getOptions and ReactScanInternals on the same signal facade", () => {
    expect(getOptions()).toBe(ReactScanInternals.options);
  });

  it("notifies option subscribers after setOptions", () => {
    const listener = vi.fn();
    const unsubscribe = ReactScanInternals.options.subscribe(listener);

    setOptions({ log: !initialOptions.log });

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ log: !initialOptions.log }));
    unsubscribe();
  });

  it("preserves writable Store signal semantics", () => {
    const listener = vi.fn();
    const unsubscribe = Store.inspectState.subscribe(listener);
    const nextState = { kind: "inspect-off" } as const;

    Store.inspectState.value = nextState;

    expect(Store.inspectState.value).toBe(nextState);
    expect(listener).toHaveBeenCalledWith(nextState);
    unsubscribe();
  });

  it("returns the legacy report map for compatibility", () => {
    expect(getReport()).toBe(Store.legacyReportData);
  });
});

describe("public package exports", () => {
  it.each(internalNativeExportNames)("does not expose %s", (exportName) => {
    expect(packageExports).not.toHaveProperty(exportName);
    expect(rscExports).not.toHaveProperty(exportName);
  });

  it("keeps the server ignoredProps facade weak-set compatible", () => {
    expect(rscExports.ignoredProps).toBeInstanceOf(WeakSet);
  });
});
