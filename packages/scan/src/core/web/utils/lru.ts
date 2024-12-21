class LRUNode<Key, Value> {
  public next: LRUNode<Key, Value> | undefined;
  public prev: LRUNode<Key, Value> | undefined;

  constructor(
    public key: Key,
    public value: Value,
  ) {}
}

/**
 * Doubly linked list LRU
 */
export class LRUMap<Key, Value> {
  private nodes = new Map<Key, LRUNode<Key, Value>>();

  private head: LRUNode<Key, Value> | undefined;
  private tail: LRUNode<Key, Value> | undefined;

  constructor(public limit: number) {}

  has(key: Key) {
    return this.nodes.has(key);
  }

  get(key: Key): Value | undefined {
    const result = this.nodes.get(key);
    return result ? result.value : undefined;
  }

  set(key: Key, value: Value): void {
    // If node already exists, bubble up
    if (this.nodes.has(key)) {
      this.bubble(key, value);
      return;
    }

    // create a new node
    const node = new LRUNode(key, value);

    if (this.head) {
      node.next = this.head;
      this.head.prev = node;
    } else {
      this.tail = node;
    }
    this.head = node;

    // if the map is already at it's limit, remove the old tail
    if (this.nodes.size === this.limit && this.tail) {
      this.delete(this.tail.key);
    }

    this.nodes.set(key, node);
  }

  delete(key: Key): void {
    const result = this.nodes.get(key);

    if (result) {
      if (result.prev) {
        result.prev.next = result.next;
      }
      if (result.next) {
        result.next.prev = result.prev;
      }

      if (result === this.tail) {
        this.tail = result.prev;
        if (this.tail) {
          this.tail.next = undefined;
        }
      }

      this.nodes.delete(key);
    }
  }

  private bubble(key: Key, value: Value) {
    const result = this.nodes.get(key);

    if (result) {
      result.value = value;
      if (this.head === result) {
        return;
      }
      // Re-link
      if (result.prev) {
        result.prev.next = result.next;
      }
      if (result.next) {
        result.next.prev = result.prev;
      }

      // insert at head
      if (this.head) {
        result.next = this.head;
        this.head.prev = result;
      }
      result.prev = undefined;
      this.head = result;
    }
  }
}
