'use client'

type EventHandler = (data: any) => void;

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;
  private isConnected = false;
  private shouldReconnect = true;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isMobile = false;

  constructor() {
    this.url = process.env.NODE_ENV === 'production'
      ? `wss://${window.location.hostname}/ws`
      : this.getMobileUrl();
    
    this.isMobile = this.detectMobile();
    this.setupMobileHandlers();
  }

  private detectMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
  }

  private getMobileUrl(): string {
    if (typeof window === 'undefined') return 'ws://localhost:4568/ws';
    
    const hostname = window.location.hostname;
    
    // If already on a network IP (mobile accessing dev server), use that IP
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `ws://${hostname}:4568/ws`;
    }
    
    // For localhost development, try to get the actual network IP
    return `ws://${this.getLocalIP()}:4568/ws`;
  }

  private getLocalIP(): string {
    if (typeof window === 'undefined') return 'localhost';
    
    const hostname = window.location.hostname;
    
    // If we're already on a network IP, use it
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return hostname;
    }
    
    // For development, use common network ranges
    // Note: In production, this would be properly configured
    const devIPs = [
      '192.168.0.107', // Current mobile testing IP
      '192.168.1.100', // Common router ranges
      '192.168.0.100',
      '10.0.0.100',    // Corporate networks
      'localhost'
    ];
    
    return devIPs[0];
  }

  private setupMobileHandlers() {
    if (typeof window === 'undefined' || !this.isMobile) return;

    // Handle mobile app state changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 App became visible, checking connection...');
        if (!this.isConnected) {
          this.attemptReconnect();
        }
      }
    });

    // Handle network changes
    window.addEventListener('online', () => {
      console.log('📡 Network came online');
      if (!this.isConnected) {
        setTimeout(() => this.attemptReconnect(), 1000);
      }
    });

    window.addEventListener('offline', () => {
      console.log('📡 Network went offline');
      this.handleNetworkDisconnection();
    });

    // Handle page focus/blur for mobile Safari
    window.addEventListener('focus', () => {
      if (!this.isConnected) {
        setTimeout(() => this.attemptReconnect(), 500);
      }
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Clear any existing connection
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }

        // Clear existing timeouts
        this.clearTimeouts();

        console.log(`🔌 Connecting to ${this.url} (Mobile: ${this.isMobile})...`);
        this.ws = new WebSocket(this.url);

        // Connection timeout for mobile
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.log('⏱️ Connection timeout, closing...');
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, this.isMobile ? 10000 : 5000);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.clearTimeouts();
          this.startPing();
          this.emit('connect', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Handle ping/pong for mobile
            if (message.type === 'pong') {
              return;
            }
            
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log(`🔌 WebSocket disconnected: ${event.reason} (Code: ${event.code})`);
          this.isConnected = false;
          this.clearTimeouts();
          this.emit('disconnect', { reason: event.reason, code: event.code });
          
          // Mobile-specific reconnection logic
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = this.isMobile ? 
              Math.min(5000, this.reconnectDelay * Math.pow(2, this.reconnectAttempts)) :
              this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
            
            this.scheduleReconnect(delay);
          }
        };

        this.ws.onerror = (error) => {
          console.error(`❌ WebSocket error: ${(error as any).message || 'Connection failed'} (Mobile: ${this.isMobile})`);
          this.clearTimeouts();
          this.emit('connect_error', { 
            message: (error as any).message || 'WebSocket connection failed',
            type: (error as any).type || 'error',
            isMobile: this.isMobile
          });
          reject(new Error((error as any).message || 'WebSocket connection failed'));
        };

      } catch (error) {
        this.clearTimeouts();
        reject(error);
      }
    });
  }

  private clearTimeouts() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private startPing() {
    if (this.isMobile) {
      // Mobile ping every 25 seconds to keep connection alive
      this.pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping', data: {} }));
        }
      }, 25000);
    }
  }

  private scheduleReconnect(delay: number) {
    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect) {
        this.attemptReconnect();
      }
    }, delay);
  }

  private handleNetworkDisconnection() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.clearTimeouts();
  }

  private handleMessage(message: any) {
    const { type, data } = message;
    if (type && this.eventHandlers.has(type)) {
      const handlers = this.eventHandlers.get(type)!;
      handlers.forEach(handler => handler(data));
    }
  }

  private attemptReconnect() {
    if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached or reconnection disabled');
      return;
    }

    this.reconnectAttempts++;
    const baseDelay = this.isMobile ? 3000 : this.reconnectDelay;
    const delay = Math.min(30000, baseDelay * Math.pow(2, this.reconnectAttempts - 1));
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms (Mobile: ${this.isMobile})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect) {
        console.log('🔄 Starting reconnection attempt...');
        this.connect().catch((error) => {
          console.log(`🔄 Reconnection ${this.reconnectAttempts} failed:`, error.message);
          // Will try again if attempts < max
        });
      }
    }, delay);
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  emit(event: string, data: any) {
    // Emit to local handlers
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event)!;
      handlers.forEach(handler => handler(data));
    }

    // Send to server if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = { type: event, data };
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.clearTimeouts();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    console.log('🔌 WebSocket manually disconnected');
  }

  get connected() {
    return this.isConnected;
  }

  get disconnected() {
    return !this.isConnected;
  }

  // Socket.IO compatibility methods
  removeAllListeners(event?: string) {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
  }

  off(event: string, handler?: EventHandler) {
    if (!handler) {
      this.eventHandlers.delete(event);
    } else {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }
  }

  close() {
    this.disconnect();
  }

  // Additional Socket.IO compatible properties
  get id() {
    return this.ws?.url || 'websocket-connection';
  }
}

export function createWebSocket(): GameWebSocket {
  return new GameWebSocket();
}