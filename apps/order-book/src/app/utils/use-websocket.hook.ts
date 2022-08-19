import { useEffect } from 'react';

export interface UseWebsocketParams<TEvent> {
  path: string;
  onMessage?: (ev: TEvent) => void;
  onError?: (ev: Event) => void;
  onOpen?: (ev: Event) => void;
}

/**
 * React hook to start websocket connection by specified path,
 * socket will maintain connection till path is change or component where used is
 * destroy
 * @param params -
 * - path websocket server path
 * - onMessage callback to be executed every time the socket server sends a message
 * - onOpen callback to be executed when connection to socket server is open
 * - onError callback to be executed every time the socket connection errors
 */
export function useWebSocket<TEvent = unknown>({
  path,
  onMessage,
  onError,
  onOpen,
}: UseWebsocketParams<TEvent>) {
  useEffect(
    () => {
      const socket = new WebSocket(path);

      if (onOpen) {
        socket.addEventListener('open', onOpen);
      }

      if (onMessage) {
        socket.addEventListener('message', (ev) => {
          const payload = JSON.parse(ev.data);
          onMessage(payload);
        });
      }

      if (onError) {
        socket.addEventListener('error', (ev) => {
          onError(ev);
        });
      }

      return () => socket.close();
    },
    // stale callbacks to prevent non memoized functions to retrigger useEffect
    // eslint-disable-next-line
    [path]
  );
}
