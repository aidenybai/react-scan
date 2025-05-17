if (!Array.prototype.toSorted) {
  Object.defineProperty(Array.prototype, 'toSorted', {
    value: function <T>(this: Array<T>, compareFn?: (a: T, b: T) => number): Array<T> {
      return [...this].sort(compareFn);
    },
    writable: true,
    configurable: true,
  });
}