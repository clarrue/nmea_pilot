/**
 * ConnectionManager provides exponential backoff for TCP reconnection.
 * Subclasses implement connect/disconnect logic.
 */
export abstract class ConnectionManager {
  protected host: string = '';
  protected port: number = 0;
  private attempt: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped: boolean = false;

  abstract doConnect(host: string, port: number): void;
  abstract doDisconnect(): void;

  connect(host: string, port: number): void {
    this.stopped = false;
    this.attempt = 0;
    this.host = host;
    this.port = port;
    this.clearTimer();
    this.doConnect(host, port);
  }

  disconnect(): void {
    this.stopped = true;
    this.clearTimer();
    this.doDisconnect();
  }

  reconnect(host: string, port: number): void {
    this.disconnect();
    // Brief pause before reconnecting to new target
    setTimeout(() => this.connect(host, port), 200);
  }

  protected onDisconnected(): void {
    if (this.stopped) {
      return;
    }
    const delay = this.calcDelay();
    this.attempt++;
    this.reconnectTimer = setTimeout(() => {
      if (!this.stopped) {
        this.doConnect(this.host, this.port);
      }
    }, delay);
  }

  protected onConnected(): void {
    this.attempt = 0;
  }

  private calcDelay(): number {
    const base = Math.min(1000 * Math.pow(2, this.attempt), 30000);
    const jitter = Math.random() * 500;
    return base + jitter;
  }

  private clearTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
