import { Order, OrderType } from '@coindee/orders-api-interfaces';
import { BookEntry, OrderBook } from '../data';

export interface InsertOrderParams {
  book: BookEntry[];
  order: Order;
  start?: number;
  end?: number;
}

/**
 * Inserts an order on the correct place depending of its price and volume
 * when there is an entry on the book that has the same price than the order
 * it adds the order volume to the entry, when there is no entry with that price
 * it adds an entry with that price and volume in the correct place to maintain the
 * entries sorted
 * NOTE: insertOrder assumes that book input containing the entries is sorted
 * @param params -
 * - book: entries to insert the order in
 * - order: order to be inserted
 * - start: for internal use
 * - end: for internal use
 */
export function insertOrder({
  book,
  order,
  start = 0,
  end = book.length - 1,
}: InsertOrderParams): void {
  // didn't find it start is the index where to insert it
  if (start > end) {
    book.splice(start, 0, { price: order.price, volume: order.volume });
    return;
  }

  const mid = Math.floor((start + end) / 2);

  const entry = book[mid];

  // found the same price
  if (entry.price === order.price) {
    entry.volume = entry.volume + order.volume;
    return;
  }

  // go left
  if (
    order.type === OrderType.Ask
      ? entry.price > order.price
      : entry.price < order.price
  ) {
    return insertOrder({ book, order, start, end: mid - 1 });
  }

  // go right
  if (
    order.type === OrderType.Ask
      ? entry.price < order.price
      : entry.price > order.price
  ) {
    return insertOrder({ book, order, start: mid + 1, end });
  }
}

/**
 * Determines whether an order match based on its price, type and volume
 * orders match to an entry when an asking price is smaller or equal that a entry (bid) price
 * a biding price is bigger or equal that a entry (ask) price
 * @param order to test against entry
 * @param entry to test against order
 */
export function isOrderMatch(order: Order, entry: BookEntry): boolean {
  if (order.volume <= 0) {
    return false;
  }

  return order.type === OrderType.Ask
    ? order.price <= entry.price
    : order.price >= entry.price;
}

export interface UpdateVolumeParams {
  entries: BookEntry[];
  order: Order;
  index?: number;
  floatingPoints?: number;
}

/**
 * Given a set of entries and an order will update the entries volume
 * till the order price match and volume is positive, when the whole entry volume
 * is consumed the entry will be removed, when is partially consumed will update
 * the volume accordingly
 * @param params -
 * - entries: to match against order when order (when order type is ask entries should be the list of bids and vice versa)
 * - order: to be match
 * - index: for internal use
 * - floatingPoints: number of floating points to fix the volume
 */
export function updateVolume({
  entries,
  order,
  index = 0,
  floatingPoints = 8,
}: UpdateVolumeParams): number {
  // base case: has gone over all entries or there is no match
  if (index >= entries.length || !isOrderMatch(order, entries[index])) {
    return order.volume;
  }

  const delta = entries[index].volume - order.volume;
  const fixedDelta = parseFloat(delta.toFixed(floatingPoints));
  // order has been match completely and there is still volume on the entry
  if (fixedDelta > 0) {
    entries[index].volume = fixedDelta;
    order.volume = 0;
    return order.volume;
  }

  // remove entry because all volume has been consumed
  entries.splice(index, 1);

  // set order new volume to delta absolute
  order.volume = Math.abs(fixedDelta);

  // there is no need to increment index because we had remove the current element at that index
  // so recursion will execute with the following one
  // example: [{ price: 58.500, volume: 0.02 }, { price: 57.600, volume: 0.01 }]
  // removing element with price: 58.500 at index 0 will place element with price: 57.600 at index 0
  return updateVolume({ entries, order, index, floatingPoints });
}

/**
 * Matches an order depending on its type to an order book, an order book is compose by the accumulated volume of asks (selling) orders and bids (buying) orders by price,
 * where the best asking price is the lowest price in the asks and the best selling price is the highest price in the bids.
 * orders are match depending its price and volume as following:
 * when an order is processed a match will mean that a bid order price is bigger or equal to a set of asking orders or an ask price is smaller or equal to a set of biding orders
 * in this case the book orders volume will be depleted till the order volume is 0, when an entry volume is depleted in its totality it will be removed from the set.
 * when an order doesn't match or its volume couldn't be consume in its totality will be placed in the opposite side with the price and the remaining volume.
 * NOTE: ASSUMES THAT ASKS ORDERS ARE SORTED ASCENDING AND BIDS ORDERS ARE SORTED IN DESCENDING DEPENDING ON ITS PRICE
 * @param orderBook: to match orders against
 * @param order: to match order book against
 */
export function matchOrder(orderBook: OrderBook, order: Order): void {
  const scanKey = order.type == OrderType.Ask ? 'bids' : 'asks';

  const remainingVolume = updateVolume({ entries: orderBook[scanKey], order });

  // we have match order volume total against order book
  if (remainingVolume <= 0) {
    return;
  }

  const insertionKey = order.type == OrderType.Ask ? 'asks' : 'bids';

  // adds to volume when same price or insert in correct position to maintain array sorted
  insertOrder({ book: orderBook[insertionKey], order });
}
