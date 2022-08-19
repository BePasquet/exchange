import { BookEntry } from './book-entry.interface';

export interface OrderBook {
  asks: BookEntry[];
  bids: BookEntry[];
}
