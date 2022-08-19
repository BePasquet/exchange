import { OrderBook } from '@coindee/order-matching-engine';
import {
  DEFAULT_ORDER_BOOK_LIMIT,
  SocketMessageType,
} from '@coindee/orders-api-interfaces';
import { useEffect, useReducer } from 'react';
import { environment } from '../../environments/environment';
import { OrderChangeMessage } from '../data/order-change-message.interface';
import { createAction, createReducer } from '../utils/redux-utils';
import { useWebSocket } from '../utils/use-websocket.hook';
import { getOrdersVolume } from './orders.service';

export interface OrderBookState {
  data: OrderBook | null;
  loading: boolean;
  error: string;
}

const ordersInitialState: OrderBookState = {
  data: null,
  loading: true,
  error: '',
};

const getOrderBook = createAction('[Order Book] Get Order Book');

const getOrderBookSuccess = createAction<OrderBook>(
  '[Order Book] Get Order Book Success'
);

const getOrderBookFail = createAction<string>(
  '[Order Book] Get Order Book Fail'
);

const updateOrderBook = createAction<OrderBook>(
  '[Order Book] Update OrderBook'
);

const updateOrderBookFail = createAction<string>(
  '[Order Book] Update OrderBook Fail'
);

export const orderBookReducer = createReducer(
  ordersInitialState,
  {
    action: getOrderBook,
    reducer: (state) => ({ ...state, loading: true, error: '' }),
  },
  {
    action: getOrderBookSuccess,
    reducer: (state, { payload }) => ({
      ...state,
      loading: false,
      data: { ...payload },
    }),
  },
  {
    action: getOrderBookFail,
    reducer: (state, { payload }) => ({
      ...state,
      loading: false,
      error: payload,
    }),
  },
  {
    action: updateOrderBook,
    reducer: (state, { payload }) => ({
      ...state,
      data: { ...payload },
    }),
  },
  {
    action: updateOrderBookFail,
    reducer: (state, { payload }) => ({
      ...state,
      loading: false,
      error: payload,
    }),
  }
);

/**
 * React hook to be able to consume live data from order book
 * @param limit the number of entries for asks and bids
 */
export function useOrderBook(
  limit: number = DEFAULT_ORDER_BOOK_LIMIT
): OrderBookState {
  const [state, dispatch] = useReducer(orderBookReducer, ordersInitialState);

  useEffect(() => {
    dispatch(getOrderBook(null));

    getOrdersVolume(limit)
      .then(({ result }) => dispatch(getOrderBookSuccess(result)))
      .catch((err) =>
        dispatch(
          getOrderBookFail(
            err?.message ?? 'Sorry there was an error please try again later'
          )
        )
      );
  }, [dispatch, limit]);

  useWebSocket<OrderChangeMessage>({
    path: `${environment.WS_URI}?limit=${limit}`,
    onMessage: (ev) => {
      if (ev?.type === SocketMessageType.OrderBookChange) {
        dispatch(updateOrderBook(ev.payload));
      }
    },
    onError: () =>
      dispatch(updateOrderBookFail('Sorry we have lost the live connection')),
  });

  return state;
}
