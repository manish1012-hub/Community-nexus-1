class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.reconnectTimer = null;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '5173' ? '127.0.0.1:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/feed`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to PharmaCare AI surveillance feed');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.listeners.forEach((callback) => callback(payload));
        } catch (e) {
          console.error('[WebSocket] Parsing message error:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Connection closed. Retrying in 4s...');
        this.reconnectTimer = setTimeout(() => this.connect(), 4000);
      };

      this.ws.onerror = (err) => {
        console.error('[WebSocket] Socket error:', err);
        if (this.ws) this.ws.close();
      };
    } catch (err) {
      console.error('[WebSocket] Connect error:', err);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();
