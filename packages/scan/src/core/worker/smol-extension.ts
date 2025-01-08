export type SmolWorkerCallback<T, R> = () => (arg: T) => Promise<R>;

export class SmolWorkerExtension<T, R> {
  private setup?: (arg: T) => Promise<R>;
  public sync = true;

  constructor(private callback: SmolWorkerCallback<T, R>) {}

  async call(
    data: T,
    _options?: {
      transfer?: Array<Transferable>;
    },
  ): Promise<R> {
    if (!this.setup) {
      this.setup = this.callback();
    }
    return this.setup(data);
  }

  destroy(): void {
    // No cleanup needed for extension version
  }
}
