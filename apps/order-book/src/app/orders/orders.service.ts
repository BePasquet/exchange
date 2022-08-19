import { OrderBook } from '@coindee/order-matching-engine';
import {
  CreateOrder,
  DEFAULT_ORDER_BOOK_LIMIT,
  Order,
  ServerResponse,
} from '@coindee/orders-api-interfaces';
import { environment } from '../../environments/environment';
import { fetchJson } from '../utils/fetch-json';
import { Reducer } from '../utils/redux-utils';

export async function getOrdersVolume(
  limit: number = DEFAULT_ORDER_BOOK_LIMIT
) {
  const response = await fetchJson<ServerResponse<OrderBook>>(
    `${environment.API_URI}/orders/book?limit=${limit}`
  );

  return response;
}

export async function createOrder(order: CreateOrder) {
  const response = await fetchJson<ServerResponse<Order>>(
    `${environment.API_URI}/orders`,
    {
      method: 'POST',
      body: JSON.stringify(order),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response;
}

export interface DepthState {
  accumulatedVolume: number;
  entriesDepth: number[];
}

export const depthInitialState: DepthState = {
  accumulatedVolume: 0,
  entriesDepth: [],
};

export interface CalculatePriceDepthParams {
  accumulatedVolume: number;
  entryVolume: number;
  maxVolume: number;
}

/**
 * Calculate the depth of an entry
 * @param params -
 * - accumulatedVolume: accumulated volume (sum of previous entries) till entry
 * - entryVolume: current entry volume
 * - maxVolume: ask or bid price with the highest volume
 */
export function calculatePriceDepth({
  accumulatedVolume,
  entryVolume,
  maxVolume,
}: CalculatePriceDepthParams): number {
  return (accumulatedVolume + entryVolume) / maxVolume;
}

/**
 * Utility to create a reducer to calculate depth per entry
 * @param maxVolume the highest volume encounter in the order book entries
 */
export function createDepthReducer(
  maxVolume: number
): Reducer<DepthState, number> {
  return (state: DepthState, volume: number) => {
    const accumulatedVolume = state.accumulatedVolume + volume;
    const entryDepth = accumulatedVolume / maxVolume;

    return {
      accumulatedVolume,
      entriesDepth: [...state.entriesDepth, entryDepth],
    };
  };
}

/**
 * Calculate the max volume by picking the ask or bid price with the highest volume
 * @param orderBook
 */
export function calculateMaxVolume(orderBook: OrderBook): number {
  const asksVolumes = orderBook.asks.map(({ volume }) => volume);
  const bidsVolumes = orderBook.bids.map(({ volume }) => volume);
  const maxVolume = Math.max(...asksVolumes, ...bidsVolumes);
  return maxVolume;
}

export interface CalculateDepthResult {
  asks: number[];
  bids: number[];
}

/**
 * Calculate depth chart based on order book asks and bids volume
 * @param book order book
 */
export function calculateDepth(book: OrderBook): CalculateDepthResult {
  const asksVolumes = book.asks.map(({ volume }) => volume);
  const bidsVolumes = book.bids.map(({ volume }) => volume);
  const maxVolume = Math.max(...asksVolumes, ...bidsVolumes);
  const depthReducer = createDepthReducer(maxVolume);

  const asks = asksVolumes.reduce(depthReducer, depthInitialState).entriesDepth;

  const bids = bidsVolumes.reduce(depthReducer, depthInitialState).entriesDepth;

  return { asks, bids };
}

export function formatPrice(price: number): string {
  return price.toLocaleString('en', {
    minimumFractionDigits: 2,
  });
}

export function formatVolume(volume: number): string {
  return volume.toLocaleString('en', {
    minimumFractionDigits: 8,
  });
}
