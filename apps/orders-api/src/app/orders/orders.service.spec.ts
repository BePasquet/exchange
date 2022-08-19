import { OrderBook } from '@coindee/order-matching-engine';
import { DEFAULT_ORDER_BOOK_LIMIT } from '@coindee/orders-api-interfaces';
import { getOrderBookLimit, getOrderBookWithLimit } from './orders.service';
describe('Orders Service', () => {
  describe('getOrderBookLimit', () => {
    it('Should return the order book limit from the url query params', () => {
      const limit = getOrderBookLimit('/depth?limit=10');
      expect(limit).toBe(10);
    });

    it('Should return the order book limit default when there is no limit in the params', () => {
      const limit = getOrderBookLimit('/depth');
      expect(limit).toBe(DEFAULT_ORDER_BOOK_LIMIT);
    });
  });

  describe('getOrderBookWithLimit', () => {
    it('Should return the number of entries specified by the limit when there are more entries than the limit', () => {
      const orderBook: OrderBook = {
        asks: [
          {
            price: 60000,
            volume: 1,
          },
          {
            price: 61000,
            volume: 1,
          },
          {
            price: 62000,
            volume: 1,
          },
        ],
        bids: [
          {
            price: 59000,
            volume: 1,
          },
          {
            price: 580000,
            volume: 1,
          },
          {
            price: 57000,
            volume: 1,
          },
        ],
      };

      const expected = {
        asks: [
          {
            price: 60000,
            volume: 1,
          },
          {
            price: 61000,
            volume: 1,
          },
        ],
        bids: [
          {
            price: 59000,
            volume: 1,
          },
          {
            price: 580000,
            volume: 1,
          },
        ],
      };

      const result = getOrderBookWithLimit(orderBook, 2);

      expect(result).toEqual(expected);
    });

    it('Should return the number of entries when there are less entries than the limit', () => {
      const orderBook: OrderBook = {
        asks: [
          {
            price: 60000,
            volume: 1,
          },
          {
            price: 61000,
            volume: 1,
          },
          {
            price: 62000,
            volume: 1,
          },
        ],
        bids: [
          {
            price: 59000,
            volume: 1,
          },
          {
            price: 580000,
            volume: 1,
          },
          {
            price: 57000,
            volume: 1,
          },
        ],
      };

      const result = getOrderBookWithLimit(orderBook, 20);

      expect(result).toEqual(orderBook);
    });
  });
});
