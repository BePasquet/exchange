import { OrderBook } from '@coindee/order-matching-engine';
import { DEFAULT_ORDER_BOOK_LIMIT } from '@coindee/orders-api-interfaces';

/**
 * Parses the limit of entries of order book from the url query params
 * returns a default limit when not preset
 * @param url to extract limit
 */
export function getOrderBookLimit(url: string): number {
  if (!url) {
    return DEFAULT_ORDER_BOOK_LIMIT;
  }

  const params = new URLSearchParams(url?.slice(url.indexOf('?')));

  const limit =
    parseInt(params.get('limit') ?? '', 10) || DEFAULT_ORDER_BOOK_LIMIT;

  return limit;
}

/**
 * Slice the order book by a specified limit per order (asks, bids) the limit is per order type
 * ex: limit = 10 will mean 10 asks and 10 bids orders
 * @param book the order book
 * @param limit number entries we need
 */
export function getOrderBookWithLimit(
  book: OrderBook,
  limit: number
): OrderBook {
  const asks = book.asks.length > limit ? book.asks.slice(0, limit) : book.asks;

  const bids = book.bids.length > limit ? book.bids.slice(0, limit) : book.bids;

  return { asks, bids };
}
