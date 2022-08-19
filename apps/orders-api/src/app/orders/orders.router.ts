import {
  DEFAULT_ORDER_BOOK_LIMIT,
  orderSchema,
} from '@coindee/orders-api-interfaces';
import { Response, Router } from 'express';
import * as uuid from 'uuid';
import { Worker } from 'worker_threads';
import { RequestWithContext } from '../data/request-with-context.interface';
import { EngineWorkerEvents } from '../engine-worker/data/engine-worker-messages.enum';
import { getOrderBookSnapshot } from '../engine-worker/engine-worker.service';
import { requestValidator } from '../utils/request-validator.middleware';

export const ordersRouter = Router();

ordersRouter.get(
  '/book',
  async ({ query, engineWorker }: RequestWithContext, res: Response) => {
    try {
      const limit =
        parseInt(query.limit as string, 10) || DEFAULT_ORDER_BOOK_LIMIT;

      const result = await getOrderBookSnapshot(engineWorker as Worker, {
        limit,
      });

      res.json({ result });
    } catch (e) {
      // add to monitoring
      console.log(e);
      res.status(500).json({
        code: 500,
        message: 'Sorry there was an error please try again later',
      });
    }
  }
);

ordersRouter.post(
  '/',
  requestValidator({ schema: orderSchema }),
  ({ engineWorker, body }: RequestWithContext, res: Response) => {
    engineWorker?.postMessage({
      type: EngineWorkerEvents.ProcessOrder,
      payload: body,
    });

    const newOrder = { id: uuid.v4(), ...body };

    res.json({ result: newOrder });
  }
);
