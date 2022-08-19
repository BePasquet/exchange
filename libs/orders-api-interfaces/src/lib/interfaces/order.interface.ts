import { OrderType } from '../enum/order-type.enum';
import { TradeSymbol } from '../enum/trade-symbol.enum';

export interface Order {
  price: number;
  volume: number;
  symbol: TradeSymbol;
  type: OrderType;
}
