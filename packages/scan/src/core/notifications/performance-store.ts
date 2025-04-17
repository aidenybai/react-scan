import { BoundedArray } from './performance-utils';
import { PerformanceEntryChannelEvent } from './performance';

type UnSubscribe = () => void;
type Callback<T> = (item: T) => void;
type Updater<T> = (state: BoundedArray<T>) => BoundedArray<T>;
type ChanelName = string;

type PerformanceEntryChannelsType<T> = {
  subscribe: (to: ChanelName, cb: Callback<T>) => UnSubscribe;
  publish: (
    item: T,
    to: ChanelName,
    dropFirst: boolean,
    createIfNoChannel: boolean,
  ) => void;
  channels: Record<
    ChanelName,
    { callbacks: BoundedArray<Callback<T>>; state: BoundedArray<T> }
  >;
  getAvailableChannels: () => BoundedArray<string>;
  updateChannelState: (
    channel: ChanelName,
    updater: Updater<T>,
    createIfNoChannel: boolean,
  ) => void;
};

export const MAX_CHANNEL_SIZE = 50;
// a set of entities communicate to each other through channels
// the state in the channel is persisted until the receiving end consumes it
// multiple subscribes to the same channel will likely lead to unintended behavior if the subscribers are separate entities
class PerformanceEntryChannels<T> implements PerformanceEntryChannelsType<T> {
  channels: PerformanceEntryChannelsType<T>['channels'] = {};
  publish(item: T, to: ChanelName, createIfNoChannel = true) {
    const existingChannel = this.channels[to];
    if (!existingChannel) {
      if (!createIfNoChannel) {
        return;
      }
      this.channels[to] = {
        callbacks: new BoundedArray<Callback<T>>(MAX_CHANNEL_SIZE),
        state: new BoundedArray<T>(MAX_CHANNEL_SIZE),
      };
      this.channels[to].state.push(item);
      return;
    }

    existingChannel.state.push(item);
    existingChannel.callbacks.forEach((cb) => cb(item));
  }

  getAvailableChannels() {
    return BoundedArray.fromArray(Object.keys(this.channels), MAX_CHANNEL_SIZE);
  }
  subscribe(to: ChanelName, cb: Callback<T>, dropFirst: boolean = false) {
    const defer = () => {
      if (!dropFirst) {
        this.channels[to].state.forEach((item) => {
          cb(item);
        });
      }
      return () => {
        const filtered = this.channels[to].callbacks.filter(
          (subscribed) => subscribed !== cb,
        );
        this.channels[to].callbacks = BoundedArray.fromArray(
          filtered,
          MAX_CHANNEL_SIZE,
        );
      };
    };
    const existing = this.channels[to];
    if (!existing) {
      this.channels[to] = {
        callbacks: new BoundedArray<Callback<T>>(MAX_CHANNEL_SIZE),
        state: new BoundedArray<T>(MAX_CHANNEL_SIZE),
      };
      this.channels[to].callbacks.push(cb);
      return defer();
    }

    existing.callbacks.push(cb);
    return defer();
  }
  updateChannelState(
    channel: ChanelName,
    updater: Updater<T>,
    createIfNoChannel = true,
  ) {
    const existingChannel = this.channels[channel];
    if (!existingChannel) {
      if (!createIfNoChannel) {
        return;
      }

      const state = new BoundedArray<T>(MAX_CHANNEL_SIZE);
      const newChannel = {
        callbacks: new BoundedArray<Callback<T>>(MAX_CHANNEL_SIZE),
        state,
      };

      this.channels[channel] = newChannel;
      newChannel.state = updater(state);
      return;
    }

    existingChannel.state = updater(existingChannel.state);
  }

  getChannelState(channel: ChanelName) {
    return (
      this.channels[channel].state ?? new BoundedArray<T>(MAX_CHANNEL_SIZE)
    );
  }
}
// todo: discriminated union the events when we start using multiple channels
// we used to use multiple channels, but now we only use 1. This is still a useful abstraction incase we ever need more channels again
export const performanceEntryChannels =
  new PerformanceEntryChannels<PerformanceEntryChannelEvent>();
