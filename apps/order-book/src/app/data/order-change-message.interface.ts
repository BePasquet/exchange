import { OrderBook } from '@coindee/order-matching-engine';
import { SocketMessageType } from '@coindee/orders-api-interfaces';

export interface OrderChangeMessage {
  type: SocketMessageType.OrderBookChange;
  payload: OrderBook;
}
