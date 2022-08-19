import { BookEntry, OrderBook } from '@coindee/order-matching-engine';
import { ReactNode, useMemo } from 'react';
import styled from 'styled-components';
import { Reducer } from '../utils/redux-utils';
import { OrdersHeader } from './orders-header.component';
import {
  calculateMaxVolume,
  calculatePriceDepth,
  formatPrice,
  formatVolume,
} from './orders.service';

export interface DepthListState {
  jsx: ReactNode[];
  accumulatedVolume: number;
}

export const depthListInitialState: DepthListState = {
  jsx: [],
  accumulatedVolume: 0,
};

export interface CreateDepthReducerParams {
  maxVolume: number;
  color: string;
}

/**
 * Utility to create a reducer to calculate depth chart
 * @param params -
 * - maxVolume: ask or bid with the highest volume
 * - color: bar background
 */
export function createBookEntryReducer({
  maxVolume,
  color,
}: CreateDepthReducerParams): Reducer<DepthListState, BookEntry> {
  return (state: DepthListState, entry: BookEntry) => {
    const depth = calculatePriceDepth({
      accumulatedVolume: state.accumulatedVolume,
      entryVolume: entry.volume,
      maxVolume,
    });

    const jsx = [
      ...state.jsx,
      <Row key={entry.price}>
        <Bar background={color} width={`${Math.min(depth * 100, 100)}%`} />
        <Text>{formatPrice(entry.price)}</Text>
        <Text>{formatVolume(entry.volume)}</Text>
      </Row>,
    ];

    return {
      jsx,
      accumulatedVolume: state.accumulatedVolume + entry.volume,
    };
  };
}

export interface OrderListUIProps {
  orderBook: OrderBook;
}

export function OrderListUI({ orderBook }: OrderListUIProps) {
  const maxVolume = useMemo(() => calculateMaxVolume(orderBook), [orderBook]);
  const asksReducer = createBookEntryReducer({ maxVolume, color: '#ee7e7e80' });
  const bidsReducer = createBookEntryReducer({ maxVolume, color: '#b2d17080' });

  const asks = orderBook.asks
    .reduce(asksReducer, depthListInitialState)
    .jsx.reverse();

  const bids = orderBook.bids.reduce(bidsReducer, depthListInitialState).jsx;

  return (
    <>
      <OrdersHeader />

      <ListContainer>
        {!orderBook.asks.length && !orderBook.bids.length ? (
          <FlexRowCenter>
            <h5>No Orders</h5>
          </FlexRowCenter>
        ) : (
          <>
            <AsksContainer>{asks}</AsksContainer>

            <div style={{ height: '50%' }}>{bids}</div>
          </>
        )}
      </ListContainer>
    </>
  );
}

const ListContainer = styled.div`
  margin-top: 6px;
  height: 800px;
  max-height: 90vh;
  border: 1px solid grey;
  overflow: auto;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: calc(100% - 4px);
  background-color: #f4f4f4;
  position: relative;
  padding: 1px 2px;
`;

const Bar = styled.div<{ background: string; width: string }>`
  position: absolute;
  top: 0;
  right: 0;
  width: ${({ width }) => width};
  background-color: ${({ background }) => background};
  height: 100%;
`;

const Text = styled.h4`
  margin: 0;
  font-size: 16px;
`;

const FlexRowCenter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  height: 100%;
`;

const AsksContainer = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 50%;
`;
