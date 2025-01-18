declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.astro' {
  const Component: unknown;
  export default Component;
}
