// Raw-string CSS imports (resolved as text by the bundler). Mirrors the
// declaration in the upstream `react-scan` package's global.d.ts so the
// re-used `~core` engine type-checks under this package too.
declare module "*.css" {
  const content: string;
  export default content;
}
