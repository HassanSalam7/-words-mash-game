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
  private isIOS = false;

  constructor() {
    this.url = process.env.NODE_ENV === 'production'
      ? 'wss://words-mash-game-production.up.railway.app/ws'
      : this.getMobileUrl();
    
    this.isMobile = this.detectMobile();
    this.isIOS = this.detectiOS();
    this.setupMobileHandlers();
  }

  private detectMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check user agent - most reliable method
    const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Enhanced touch capability detection
    const touchMobile = (
      'ontouchstart' in window ||
      'ontouchend' in window ||
      'ontouchmove' in window ||
      navigator.maxTouchPoints > 0 ||
      (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch ||
      /Mobi|Android/i.test(navigator.userAgent)
    );
    
    // Check screen size (mobile-like dimensions) - more flexible
    const screenMobile = window.innerWidth <= 768;
    
    // iPad detection (reports as desktop but is mobile)
    const iPadMobile = navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform);
    
    // Modern mobile detection for newer browsers
    const modernMobile = ('navigator' in window && 'userAgentData' in navigator && 
      (navigator as any).userAgentData?.mobile);
    
    const isMobile = userAgentMobile || touchMobile || screenMobile || iPadMobile || modernMobile;
    
    console.log(`📱 Mobile detection: ${isMobile} (UA: ${userAgentMobile}, Touch: ${touchMobile}, Screen: ${screenMobile}, iPad: ${iPadMobile}, Modern: ${modernMobile})`);
    
    return isMobile;
  }

  private detectiOS(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
  }

  private getMobileUrl(): string {
    if (typeof window === 'undefined') return 'ws://localhost:4568/ws';
    
    const hostname = window.location.hostname;
    
    // If on production (Vercel), connect to Railway backend
    if (hostname.includes('vercel.app') || hostname.includes('localhost') === false) {
      return 'wss://words-mash-game-production.up.railway.app/ws';
    }
    
    // For local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `ws://${this.getLocalIP()}:4568/ws`;
    }
    
    // Fallback to Railway for any other case
    return 'wss://words-mash-game-production.up.railway.app/ws';
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

    // iOS Safari specific handling
    if (this.isIOS) {
      // iOS Safari suspends WebSockets when tab goes background
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          console.log('🍎 iOS app became visible, forcing reconnect...');
          // Force reconnect on iOS when app becomes visible
          setTimeout(() => {
            if (!this.isConnected) {
              this.attemptReconnect();
            } else {
              // Test connection with ping
              this.testConnection();
            }
          }, 100);
        } else {
          console.log('🍎 iOS app went background, connection may suspend');
        }
      });

      // iOS specific pageshow/pagehide events
      window.addEventListener('pageshow', () => {
        console.log('🍎 iOS pageshow event');
        setTimeout(() => this.testConnection(), 200);
      });

      window.addEventListener('pagehide', () => {
        console.log('🍎 iOS pagehide event');
      });
    } else {
      // Standard mobile handling for non-iOS
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          console.log('📱 App became visible, checking connection...');
          if (!this.isConnected) {
            this.attemptReconnect();
          }
        }
      });
    }

    // Handle network changes - iOS network events are less reliable
    window.addEventListener('online', () => {
      console.log('📡 Network came online');
      if (!this.isConnected) {
        const delay = this.isIOS ? 2000 : 1000; // iOS needs more time
        setTimeout(() => this.attemptReconnect(), delay);
      }
    });

    window.addEventListener('offline', () => {
      console.log('📡 Network went offline');
      this.handleNetworkDisconnection();
    });

    // Handle page focus/blur - critical for iOS Safari
    window.addEventListener('focus', () => {
      if (this.isIOS) {
        console.log('🍎 iOS focus - testing connection');
        setTimeout(() => {
          if (!this.isConnected) {
            this.attemptReconnect();
          } else {
            this.testConnection();
          }
        }, 100);
      } else if (!this.isConnected) {
        setTimeout(() => this.attemptReconnect(), 500);
      }
    });

    window.addEventListener('blur', () => {
      if (this.isIOS) {
        console.log('🍎 iOS blur - connection may be suspended');
      }
    });
  }

  private testConnection() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'ping', data: {} }));
        console.log('🔍 Testing connection with ping');
      } catch (error) {
        console.log('❌ Connection test failed, reconnecting...');
        this.attemptReconnect();
      }
    } else {
      console.log('🔍 Connection not open, attempting reconnect...');
      this.attemptReconnect();
    }
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

        // Connection timeout - iOS needs more time
        const timeoutMs = this.isIOS ? 15000 : (this.isMobile ? 10000 : 5000);
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.log('⏱️ Connection timeout, closing...');
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, timeoutMs);

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
          
          // Mobile-specific reconnection logic - iOS gets more aggressive reconnection
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = this.isIOS ? 
              Math.min(3000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts)) :
              (this.isMobile ? 
                Math.min(5000, this.reconnectDelay * Math.pow(2, this.reconnectAttempts)) :
                this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1));
            
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
    // iOS needs more frequent pings due to aggressive power management
    const pingInterval = this.isIOS ? 15000 : (this.isMobile ? 25000 : 30000);
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Browser WebSockets don't support ping() frames, always use JSON
        this.ws.send(JSON.stringify({ type: 'ping', data: {} }));
        console.log(`🏓 Ping sent (iOS: ${this.isIOS}, Mobile: ${this.isMobile})`);
      }
    }, pingInterval);
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