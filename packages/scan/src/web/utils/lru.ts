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
    if (result) {
      this.bubble(result);
      return result.value;
    }
    return undefined;
  }

  set(key: Key, value: Value): void {
    // If node already exists, bubble up
    if (this.nodes.has(key)) {
      const result = this.nodes.get(key);
      if (result) {
        this.bubble(result);
      }
      return;
    }

    // create a new node
    const node = new LRUNode(key, value);

    // Set node as head
    this.insertHead(node);

    // if the map is already at it's limit, remove the old tail
    if (this.nodes.size === this.limit && this.tail) {
      this.delete(this.tail.key);
    }

    this.nodes.set(key, node);
  }

  delete(key: Key): void {
    const result = this.nodes.get(key);

    if (result) {
      this.removeNode(result);
      this.nodes.delete(key);
    }
  }

  private insertHead(node: LRUNode<Key, Value>): void {
    if (this.head) {
      node.next = this.head;
      this.head.prev = node;
    } else {
      this.tail = node;
      node.next = undefined;
    }
    node.prev = undefined;
    this.head = node;
  }

  private removeNode(node: LRUNode<Key, Value>): void {
    // Link previous node to next node
    if (node.prev) {
      node.prev.next = node.next;
    }
    // and vice versa
    if (node.next) {
      node.next.prev = node.prev;
    }

    if (node === this.tail) {
      this.tail = node.prev;
      if (this.tail) {
        this.tail.next = undefined;
      }
    }
  }

  private insertBefore(
    node: LRUNode<Key, Value>,
    newNode: LRUNode<Key, Value>,
  ) {
    newNode.next = node;
    if (node.prev) {
      newNode.prev = node.prev;
      node.prev.next = newNode;
    } else {
      newNode.prev = undefined;
      this.head = newNode;
    }
    node.prev = newNode;
  }

  private bubble(node: LRUNode<Key, Value>) {
    if (node.prev) {
      // Remove the node
      this.removeNode(node);
      // swap places with previous node
      this.insertBefore(node.prev, node);
    }
  }
}
