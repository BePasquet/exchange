import {
  DEFAULT_ORDER_BOOK_LIMIT,
  SocketMessageType,
} from '@coindee/orders-api-interfaces';
import * as cors from 'cors';
import * as express from 'express';
import { createServer } from 'http';
import * as uuid from 'uuid';
import { Worker } from 'worker_threads';
import { Server } from 'ws';
import { RequestWithContext } from './data/request-with-context.interface';
import { WebsocketClient } from './data/websocket-client.interface';
import { EngineWorkerEvents } from './engine-worker/data/engine-worker-messages.enum';

import { ordersRouter } from './orders/orders.router';
import {
  getOrderBookLimit,
  getOrderBookWithLimit,
} from './orders/orders.service';

/**
 * Main thread entry point, starts order matching engine, http and websocket server
 */
export function main(): void {
  const app = express();

  // Middleware
  app.use(cors({ origin: ['http://localhost:4200'] }));
  app.use(express.json());

  const server = createServer(app);

  const websocketServer = new Server({ server, path: '/order-book' });

  /**
   * Keeps track of the limit of book entries requested for each client
   */
  const clientsLimits = new Map<string, number>();

  /**
   * When a client connects adds the requested limit of entires to a client limit dictionary
   */
  websocketServer.addListener(
    'connection',
    async (client: WebsocketClient, request) => {
      const limit = getOrderBookLimit(request.url ?? '');
      const id = uuid.v4();
      client.id = id;
      clientsLimits.set(id, limit);

      client.once('close', () => {
        clientsLimits.delete(id);
      });
    }
  );

  /**
   * Starts order matching engine on worker thread
   * note: this has to be run in a place where there is a check for the main thread check: ```main.ts```
   */
  const engineWorker = new Worker(__filename);

  /**
   * Set up a listener for workers thread messages
   */
  engineWorker.on('message', (message) => {
    if (message.type === EngineWorkerEvents.OrderBookChange) {
      // Notifies clients connected to websocket server that the order book has changed
      websocketServer.clients.forEach((client: WebsocketClient) => {
        const limit = client.id
          ? clientsLimits.get(client.id) ?? DEFAULT_ORDER_BOOK_LIMIT
          : DEFAULT_ORDER_BOOK_LIMIT;

        return client.send(
          JSON.stringify({
            type: SocketMessageType.OrderBookChange,
            payload: getOrderBookWithLimit(message.payload, limit),
          })
        );
      });
    }
  });

  /**
   * Middleware to pass reference to the engine worker through request object
   */
  app.use((req: RequestWithContext, _, next) => {
    req.engineWorker = engineWorker;
    next();
  });

  app.use('/orders', ordersRouter);

  const port = process.env.port || 3333;

  server
    .listen(port, () => console.log(`Listening on port ${port}`))
    .on('error', (err) => {
      console.error(err);
      websocketServer.removeAllListeners();
      engineWorker.removeAllListeners();
    });
}
