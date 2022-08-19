import * as joi from 'joi';
import { OrderType, TradeSymbol } from '../enum';

const TRADE_SYMBOLS = Object.values(TradeSymbol);

const ORDER_TYPES = Object.values(OrderType);

export const orderSchema = joi.object().keys({
  price: joi.number().greater(0).precision(2).required(),
  volume: joi.number().greater(0).precision(8).required(),
  symbol: joi
    .any()
    .allow(...TRADE_SYMBOLS)
    .required(),
  type: joi
    .any()
    .allow(...ORDER_TYPES)
    .required(),
});
