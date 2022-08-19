import { Order } from '../interfaces';

export type CreateOrder = Omit<Order, 'id'>;
