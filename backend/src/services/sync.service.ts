import { Response } from 'express';
import { EventEmitter } from 'events';

class SyncService {
  private eventEmitter: EventEmitter;
  private clients: Set<Response>;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(100);
    this.clients = new Set();
  }

  // Subscribe a client (Web or Mobile) to real-time events via Server-Sent Events (SSE)
  public subscribeClient(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    this.clients.add(res);

    // Initial connection ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    const onEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    this.eventEmitter.on('sync_event', onEvent);

    res.on('close', () => {
      this.eventEmitter.removeListener('sync_event', onEvent);
      this.clients.delete(res);
      res.end();
    });
  }

  // Broadcast mutation event to all connected web and mobile devices
  public broadcast(type: string, payload: any): void {
    const eventData = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.eventEmitter.emit('sync_event', eventData);
  }
}

export const syncService = new SyncService();
