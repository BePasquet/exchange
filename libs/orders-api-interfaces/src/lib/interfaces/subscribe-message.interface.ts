import { SocketMessageType, TradeSymbol } from '../enum';

export interface SocketSubscribe {
  type: SocketMessageType.Subscribe;
  symbol: TradeSymbol;
}
