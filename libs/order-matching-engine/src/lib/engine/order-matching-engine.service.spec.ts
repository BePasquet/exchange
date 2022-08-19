import { Order, OrderType, TradeSymbol } from '@coindee/orders-api-interfaces';
import { BookEntry } from '../data';
import {
  insertOrder,
  isOrderMatch,
  matchOrder,
  updateVolume,
} from './order-matching-engine.service';

describe('Order Matching Engine Service', () => {
  describe('insertOrder', () => {
    it('Should add the order volume to the existing volume of the order price when price exist in order book', () => {
      const asks: BookEntry[] = [{ price: 20000, volume: 1 }];

      const askOrder: Order = {
        price: 20000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      };

      insertOrder({ book: asks, order: askOrder });
      expect(asks).toEqual([{ price: 20000, volume: 3 }]);

      const bids: BookEntry[] = [{ price: 20000, volume: 1 }];

      const bidOrder: Order = {
        price: 20000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      insertOrder({ book: bids, order: bidOrder });
      expect(bids).toEqual([{ price: 20000, volume: 3 }]);
    });

    it('Should add the order volume and price to the order book in the correct order when price does not exist', () => {
      const asks: BookEntry[] = [{ price: 20000, volume: 1 }];

      const askOrder: Order = {
        price: 30000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      };

      insertOrder({ book: asks, order: askOrder });

      expect(asks).toEqual([
        { price: 20000, volume: 1 },
        { price: 30000, volume: 2 },
      ]);

      const bids: BookEntry[] = [{ price: 40000, volume: 1 }];

      const bidOrder: Order = {
        price: 30000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      insertOrder({ book: bids, order: bidOrder });

      expect(bids).toEqual([
        { price: 40000, volume: 1 },
        { price: 30000, volume: 2 },
      ]);
    });

    it('Should insert to the book entries when there is no entry in the input array', () => {
      const asks: BookEntry[] = [];

      const askOrder: Order = {
        price: 30000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      };

      insertOrder({ book: asks, order: askOrder });

      expect(asks).toEqual([{ price: 30000, volume: 2 }]);

      const bids: BookEntry[] = [];

      const bidsOrder: Order = {
        price: 30000,
        volume: 3,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      insertOrder({ book: bids, order: bidsOrder });

      expect(bids).toEqual([{ price: 30000, volume: 3 }]);
    });
  });

  describe('isOrderMatch', () => {
    it('Should not match an order when the volume of the order is 0 or less', () => {
      const entry: BookEntry = { price: 30000, volume: 2 };

      const order: Order = {
        price: 30000,
        volume: 0,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      };

      expect(isOrderMatch(order, entry)).toBe(false);
    });

    it('Should match an order when the volume of the order is not 0 or less and the order price is smaller or equal to the entry price (ask order) ', () => {
      const bid: BookEntry = { price: 30000, volume: 2 };

      const equalOrder: Order = {
        price: 30000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      };

      expect(isOrderMatch(equalOrder, bid)).toBe(true);

      const entry: BookEntry = { price: 30000, volume: 2 };

      const smallerOrder: Order = {
        price: 20000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      };

      expect(isOrderMatch(smallerOrder, entry)).toBe(true);
    });

    it('Should not match an order when the volume of the order is not 0 or less and the order price is bigger to the entry price (ask order) ', () => {
      const bid: BookEntry = { price: 30000, volume: 2 };

      const order: Order = {
        price: 40000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      };

      expect(isOrderMatch(order, bid)).toBe(false);
    });

    it('Should match an order when the volume of the order is not 0 or less and the order price is bigger or equal to the entry price (bid order) ', () => {
      const ask: BookEntry = { price: 30000, volume: 2 };

      const equalOrder: Order = {
        price: 30000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      expect(isOrderMatch(equalOrder, ask)).toBe(true);

      const entry: BookEntry = { price: 30000, volume: 2 };

      const biggerOrder: Order = {
        price: 40000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      expect(isOrderMatch(biggerOrder, entry)).toBe(true);
    });

    it('Should not match an order when the volume of the order is not 0 or less and the order price is smaller to the entry price (bid order) ', () => {
      const ask: BookEntry = { price: 40000, volume: 2 };

      const order: Order = {
        price: 30000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      expect(isOrderMatch(order, ask)).toBe(false);
    });
  });

  describe('updateVolume', () => {
    it('Should not update the entries when an empty array is passed as an input in entries', () => {
      const entries: BookEntry[] = [];

      const order: Order = {
        price: 30000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      updateVolume({ entries, order });

      expect(entries).toEqual([]);
    });

    it('Should not update the entries when there is not an order that match the entries', () => {
      const entries: BookEntry[] = [
        { price: 20000, volume: 1 },
        { price: 30000, volume: 2 },
      ];

      const order: Order = {
        price: 10000,
        volume: 2,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      updateVolume({ entries, order });

      expect(entries).toEqual(entries);
    });

    it('Should remove the first entry when an order match on the first entry with volume and price', () => {
      const entries: BookEntry[] = [
        { price: 20000, volume: 1 },
        { price: 30000, volume: 2 },
      ];

      const order: Order = {
        price: 40000,
        volume: 1,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      updateVolume({ entries, order });

      expect(entries).toEqual([{ price: 30000, volume: 2 }]);
    });

    it('Should remove entries till order price match and volume is depleted', () => {
      const entries: BookEntry[] = [
        { price: 20000, volume: 1 },
        { price: 30000, volume: 2 },
        { price: 40000, volume: 2 },
      ];

      const order: Order = {
        price: 40000,
        volume: 5,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      updateVolume({ entries, order });

      expect(entries).toEqual([]);
    });

    it('Should partially update the volume of the entries when there is an entry with more volume than the order', () => {
      const entries: BookEntry[] = [
        { price: 20000, volume: 2 },
        { price: 30000, volume: 2 },
      ];

      const order: Order = {
        price: 20000,
        volume: 1,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      };

      updateVolume({ entries, order });

      expect(entries).toEqual([
        { price: 20000, volume: 1 },
        { price: 30000, volume: 2 },
      ]);
    });
  });

  describe('matchOrder', () => {
    it('Should update order book when orders are match', () => {
      const orderBook = { asks: [], bids: [] };
      expect(orderBook).toEqual({ asks: [], bids: [] });

      matchOrder(orderBook, {
        price: 59000,
        volume: 0.01,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      expect(orderBook).toEqual({
        asks: [],
        bids: [
          {
            price: 59000,
            volume: 0.01,
          },
        ],
      });

      matchOrder(orderBook, {
        price: 60100,
        volume: 0.01,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      });

      expect(orderBook).toEqual({
        asks: [{ price: 60100, volume: 0.01 }],
        bids: [
          {
            price: 59000,
            volume: 0.01,
          },
        ],
      });

      matchOrder(orderBook, {
        price: 60100,
        volume: 0.04,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      });

      expect(orderBook).toEqual({
        asks: [{ price: 60100, volume: 0.05 }],
        bids: [
          {
            price: 59000,
            volume: 0.01,
          },
        ],
      });

      matchOrder(orderBook, {
        price: 60100,
        volume: 0.02,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      expect(orderBook).toEqual({
        asks: [{ price: 60100, volume: 0.03 }],
        bids: [
          {
            price: 59000,
            volume: 0.01,
          },
        ],
      });

      matchOrder(orderBook, {
        price: 61500,
        volume: 0.05,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      });

      matchOrder(orderBook, {
        price: 58500,
        volume: 0.08,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      matchOrder(orderBook, {
        price: 60010,
        volume: 0.02,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      });

      matchOrder(orderBook, {
        price: 57600,
        volume: 0.02,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      expect(orderBook).toEqual({
        asks: [
          { price: 60010, volume: 0.02 },
          { price: 60100, volume: 0.03 },
          { price: 61500, volume: 0.05 },
        ],
        bids: [
          {
            price: 59000,
            volume: 0.01,
          },
          {
            price: 58500,
            volume: 0.08,
          },
          {
            price: 57600,
            volume: 0.02,
          },
        ],
      });

      matchOrder(orderBook, {
        price: 40000,
        volume: 0.06,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      });

      expect(orderBook).toEqual({
        asks: [
          { price: 60010, volume: 0.02 },
          { price: 60100, volume: 0.03 },
          { price: 61500, volume: 0.05 },
        ],
        bids: [
          {
            price: 58500,
            volume: 0.03,
          },
          {
            price: 57600,
            volume: 0.02,
          },
        ],
      });

      matchOrder(orderBook, {
        price: 69420,
        volume: 0.169,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      expect(orderBook).toEqual({
        asks: [],
        bids: [
          {
            price: 69420,
            volume: 0.069,
          },
          {
            price: 58500,
            volume: 0.03,
          },
          {
            price: 57600,
            volume: 0.02,
          },
        ],
      });
    });
  });
});
