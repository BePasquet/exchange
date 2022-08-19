import { WebSocket } from 'ws';

export interface WebsocketClient extends WebSocket {
  id?: string;
}
