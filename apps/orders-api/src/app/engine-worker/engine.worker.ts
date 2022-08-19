import { OrderMatchingEngine } from '@coindee/order-matching-engine';
import { parentPort } from 'worker_threads';
import { EngineWorkerEvents } from './data/engine-worker-messages.enum';

export const orderMatchingEngine = new OrderMatchingEngine();

orderMatchingEngine.subscribe((orderBook) =>
  parentPort?.postMessage({
    type: EngineWorkerEvents.OrderBookChange,
    payload: orderBook,
  })
);

parentPort?.on('message', (message) => {
  switch (message.type) {
    case EngineWorkerEvents.ProcessOrder:
      orderMatchingEngine.processOrder(message.payload);
      break;

    case EngineWorkerEvents.GetSnapshot:
      parentPort?.postMessage({
        type: EngineWorkerEvents.GetSnapshot,
        payload: orderMatchingEngine.snapshot(),
      });
      break;
  }
});
