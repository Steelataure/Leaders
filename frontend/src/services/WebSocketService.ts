import { Client, type Message } from '@stomp/stompjs';

declare global {
    interface Window {
        config?: {
            API_URL?: string;
        };
    }
}

const getSocketUrl = () => {
    // FORCE local WebSocket connection on localhost (via Vite proxy /api)
    if (window.location.hostname === 'localhost') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/api/ws/websocket`;
    }

    // If we're NOT on localhost, we MUST use our current host + /api/ws
    // to go through the Nginx proxy correctly.
    if (window.location.hostname !== 'localhost') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // /websocket suffix is mandatory for some Spring SockJS configurations using standard WS
        return `${protocol}//${window.location.host}/api/ws/websocket`;
    }

    // Local/Legacy fallback
    const url = window.config?.API_URL || import.meta.env.VITE_API_URL || '';
    if (!url || url.startsWith('/')) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/api/ws`;
    }

    // Absolute URL case (e.g. local dev pointing to remote)
    let normalized = url.replace(/\/$/, '');
    if (!normalized.endsWith('/api') && !normalized.includes('/api/')) {
        normalized += '/api';
    }
    const rootUrl = normalized.replace(/\/api$/, '');
    return rootUrl.replace(/^http/, 'ws') + '/ws';
};

const SOCKET_URL = getSocketUrl();

class WebSocketService {
    private client: Client;
    private connected: boolean = false;

    constructor() {
        console.log('Connecting to WebSocket at:', SOCKET_URL);
        this.client = new Client({
            brokerURL: SOCKET_URL,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                this.connected = true;
                console.log('Connected to WebSocket');
            },
            onDisconnect: () => {
                this.connected = false;
                console.log('Disconnected from WebSocket');
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            debug: (str) => {
                console.log(str);
            },
        });

        this.client.activate();
    }

    subscribeToSession(sessionId: string, callback: (session: any) => void) {
        if (!this.connected) {
            // If not connected yet, wait a bit or retry
            // For simplicity, we assume generic connection is fast.
            // You might want to wrap this in a waitForConnection logic in production.
            const checkInterval = setInterval(() => {
                if (this.connected) {
                    clearInterval(checkInterval);
                    this.doSubscribe(`/topic/session/${sessionId}`, callback);
                }
            }, 100);
        } else {
            this.doSubscribe(`/topic/session/${sessionId}`, callback);
        }
    }

    subscribeToGame(gameId: string, callback: (gameState: any) => void) {
        if (!this.connected) {
            const checkInterval = setInterval(() => {
                if (this.connected) {
                    clearInterval(checkInterval);
                    this.doSubscribe(`/topic/game/${gameId}`, callback);
                }
            }, 100);
        } else {
            this.doSubscribe(`/topic/game/${gameId}`, callback);
        }
    }

    private doSubscribe(topic: string, callback: (data: any) => void) {
        console.log(`Attempting to subscribe to ${topic}`);
        this.client.subscribe(topic, (message: Message) => {
            console.log(`Received message on ${topic}:`, message.body);
            if (message.body) {
                const data = JSON.parse(message.body);
                callback(data);
            }
        });
    }

    disconnect() {
        this.client.deactivate();
    }

    isConnected(): boolean {
        return this.connected;
    }
}

export const webSocketService = new WebSocketService();
