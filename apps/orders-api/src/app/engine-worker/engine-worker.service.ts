import { DEFAULT_ORDER_BOOK_LIMIT } from '@coindee/orders-api-interfaces';
import { Worker } from 'worker_threads';
import { getOrderBookWithLimit } from '../orders/orders.service';
import { EngineWorkerEvents } from './data/engine-worker-messages.enum';

export interface GetOrderBookSnapshotOptions {
  timeout?: number;
  limit?: number;
}

export function getOrderBookSnapshot(
  engineWorker: Worker,
  {
    timeout = 1000,
    limit = DEFAULT_ORDER_BOOK_LIMIT,
  }: GetOrderBookSnapshotOptions
) {
  return new Promise((resolve, reject) => {
    // timeouts if doesn't receive a message in specified time
    const timerId = setTimeout(() => {
      reject('timeout');
    }, timeout);

    const onMessage = (message: any) => {
      if (message.type === EngineWorkerEvents.GetSnapshot) {
        const orderBook = getOrderBookWithLimit(message.payload, limit);

        resolve(orderBook);
        removeListeners();
      }
    };

    const onError = (err: Error) => {
      reject(err);
      removeListeners();
    };

    const onExit = (code: number) => {
      if (code !== 0) {
        reject(code);
        removeListeners();
      }
    };

    const removeListeners = () => {
      engineWorker.removeListener('message', onMessage);
      engineWorker.removeListener('error', onError);
      engineWorker.removeListener('exit', onExit);
      clearTimeout(timerId);
    };

    engineWorker.on('message', onMessage);

    engineWorker.on('error', onError);

    engineWorker.on('exit', onExit);

    engineWorker.postMessage({ type: EngineWorkerEvents.GetSnapshot });
  });
}
