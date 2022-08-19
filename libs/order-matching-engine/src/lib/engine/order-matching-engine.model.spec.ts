import { OrderType, TradeSymbol } from '@coindee/orders-api-interfaces';
import { OrderMatchingEngine } from './order-matching-engine.model';

describe('OrderMatchingEngine', () => {
  describe('snapshot', () => {
    it('Should return a copy of the order book', () => {
      const engine = new OrderMatchingEngine();
      const state = engine.snapshot();

      // testing private property
      // eslint-disable-next-line
      // @ts-ignore
      expect(state).toEqual(engine.orderBook);
    });
  });

  describe('subscribe', () => {
    it('Should call subscriber function every time order book change', () => {
      const engine = new OrderMatchingEngine();
      const subscriber = jest.fn();
      const unsubscribe = engine.subscribe(subscriber);

      engine.processOrder({
        price: 59000,
        volume: 0.01,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      expect(subscriber).toHaveBeenCalledWith(engine.snapshot());

      unsubscribe();
    });

    it('Should not call subscriber function once subscription has been removed', () => {
      const engine = new OrderMatchingEngine();
      const subscriber = jest.fn();
      const unsubscribe = engine.subscribe(subscriber);

      engine.processOrder({
        price: 59000,
        volume: 0.01,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      unsubscribe();

      engine.processOrder({
        price: 58000,
        volume: 0.01,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('processOrder', () => {
    it('Given the order book is empty, when a set of orders are processed, then match orders with order book', () => {
      const engine = new OrderMatchingEngine();

      expect(engine.snapshot()).toEqual({ asks: [], bids: [] });

      engine.processOrder({
        price: 59000,
        volume: 0.01,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      expect(engine.snapshot()).toEqual({
        asks: [],
        bids: [
          {
            price: 59000,
            volume: 0.01,
          },
        ],
      });

      engine.processOrder({
        price: 60100,
        volume: 0.01,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      });

      expect(engine.snapshot()).toEqual({
        asks: [{ price: 60100, volume: 0.01 }],
        bids: [
          {
            price: 59000,
            volume: 0.01,
          },
        ],
      });

      engine.processOrder({
        price: 60100,
        volume: 0.04,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      });

      expect(engine.snapshot()).toEqual({
        asks: [{ price: 60100, volume: 0.05 }],
        bids: [
          {
            price: 59000,
            volume: 0.01,
          },
        ],
      });

      engine.processOrder({
        price: 60100,
        volume: 0.02,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      expect(engine.snapshot()).toEqual({
        asks: [{ price: 60100, volume: 0.03 }],
        bids: [
          {
            price: 59000,
            volume: 0.01,
          },
        ],
      });

      engine.processOrder({
        price: 61500,
        volume: 0.05,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      });

      engine.processOrder({
        price: 58500,
        volume: 0.08,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      engine.processOrder({
        price: 60010,
        volume: 0.02,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      });

      engine.processOrder({
        price: 57600,
        volume: 0.02,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      expect(engine.snapshot()).toEqual({
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

      engine.processOrder({
        price: 40000,
        volume: 0.06,
        symbol: TradeSymbol.BTC,
        type: OrderType.Ask,
      });

      expect(engine.snapshot()).toEqual({
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

      engine.processOrder({
        price: 69420,
        volume: 0.169,
        symbol: TradeSymbol.BTC,
        type: OrderType.Bid,
      });

      expect(engine.snapshot()).toEqual({
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
