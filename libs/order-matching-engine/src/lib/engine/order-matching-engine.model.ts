import { Order } from '@coindee/orders-api-interfaces';
import { EventEmitter } from 'events';
import { OrderBook } from '../data';
import { matchOrder } from './order-matching-engine.service';

export class OrderMatchingEngine {
  /**
   * Order book state
   */
  private readonly orderBook: OrderBook = {
    asks: [],
    bids: [],
  };

  /**
   * Used to notify subscribers of a change in the order book
   */
  private readonly emitter = new EventEmitter();

  /**
   * Process an order against the order book
   * @param order to be processed
   */
  processOrder(order: Order): void {
    matchOrder(this.orderBook, order);
    this.emitter.emit('orderBookChange', this.orderBook);
  }

  /**
   * Synchronously returns a snapshot of the order book at a given point in time
   */
  snapshot(): OrderBook {
    return { asks: [...this.orderBook.asks], bids: [...this.orderBook.bids] };
  }

  /**
   * Once applied will notify of order book changes via the subscriber function
   * @param subscriber function to be called every time the order book change
   * @returns a clean up function that once is called will unsubscribe from the order book change
   * not delivering anymore changes to the subscriber and releasing resources
   */
  subscribe(subscriber: (book: OrderBook) => void): VoidFunction {
    this.emitter.addListener('orderBookChange', subscriber);

    return () => {
      this.emitter.removeListener('orderBookChange', subscriber);
    };
  }
}
