/**
 * syncService.ts - Real-time SSE connection to the AgroVision shared backend.
 * Manages the EventSource connection, reconnection logic, and event dispatching.
 */

const SSE_URL = '/api/sync/events';

type SyncEventHandler = (eventType: string, data: unknown) => void;
type ConnectionStatusHandler = (status: 'connected' | 'disconnected' | 'reconnecting') => void;

class SyncService {
  private eventSource: EventSource | null = null;
  private handlers: SyncEventHandler[] = [];
  private statusHandlers: ConnectionStatusHandler[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 3000;
  private maxReconnectDelay = 30000;
  private shouldConnect = false;

  /** Start listening to backend SSE events */
  connect() {
    this.shouldConnect = true;
    this._openConnection();
  }

  /** Stop the SSE connection */
  disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this._notifyStatus('disconnected');
  }

  private _openConnection() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(SSE_URL);

      this.eventSource.onopen = () => {
        this.reconnectDelay = 3000;
        this._notifyStatus('connected');
      };

      this.eventSource.onerror = () => {
        this.eventSource?.close();
        this.eventSource = null;
        if (this.shouldConnect) {
          this._notifyStatus('reconnecting');
          this.reconnectTimer = setTimeout(() => {
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
            this._openConnection();
          }, this.reconnectDelay);
        }
      };

      // Generic message handler
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._dispatchEvent('message', data);
        } catch {
          // Non-JSON ping/comment, ignore
        }
      };

      // Named event listeners for specific backend events
      const namedEvents = [
        'FARM_CREATED', 'FARM_UPDATED',
        'FIELD_CREATED', 'FIELD_UPDATED', 'FIELD_DELETED',
        'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED',
        'OBSERVATION_CREATED', 'OBSERVATION_UPDATED', 'OBSERVATION_DELETED',
        'MEDIA_CREATED', 'MEDIA_DELETED',
        'REMINDER_CREATED', 'REMINDER_UPDATED', 'REMINDER_DELETED',
        'DEVICE_STATUS_CHANGED', 'ACTIVITY_CREATED',
      ];

      for (const eventName of namedEvents) {
        this.eventSource.addEventListener(eventName, (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            this._dispatchEvent(eventName, data);
          } catch {
            // Ignore parse errors
          }
        });
      }
    } catch {
      if (this.shouldConnect) {
        this._notifyStatus('reconnecting');
        this.reconnectTimer = setTimeout(() => this._openConnection(), this.reconnectDelay);
      }
    }
  }

  private _dispatchEvent(eventType: string, data: unknown) {
    for (const handler of this.handlers) {
      try {
        handler(eventType, data);
      } catch {
        // Handler errors should not crash the sync loop
      }
    }
  }

  private _notifyStatus(status: 'connected' | 'disconnected' | 'reconnecting') {
    for (const handler of this.statusHandlers) {
      try {
        handler(status);
      } catch {
        // Ignore
      }
    }
  }

  /** Register a handler to receive all sync events */
  onEvent(handler: SyncEventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  /** Register a handler to receive connection status changes */
  onStatusChange(handler: ConnectionStatusHandler): () => void {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
    };
  }
}

export const syncService = new SyncService();
export type { SyncEventHandler, ConnectionStatusHandler };
