import { Client, type Message } from '@stomp/stompjs';

declare global {
    interface Window {
        config?: {
            API_URL?: string;
        };
    }
}

const getSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // In production, we go through the Nginx proxy which targets /api
    // In local dev, Vite proxy handles /api
    // We now use the raw endpoint /ws-raw which is more robust through proxies
    return `${protocol}//${window.location.host}/api/ws-raw`;
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

    subscribeToChat(sessionId: string, callback: (message: any) => void) {
        if (!this.connected) {
            const checkInterval = setInterval(() => {
                if (this.connected) {
                    clearInterval(checkInterval);
                    this.doSubscribe(`/topic/chat/${sessionId}`, callback);
                }
            }, 100);
        } else {
            this.doSubscribe(`/topic/chat/${sessionId}`, callback);
        }
    }

    sendMessage(sessionId: string, payload: any) {
        if (this.connected) {
            this.client.publish({
                destination: `/app/chat/${sessionId}`,
                body: JSON.stringify(payload),
            });
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
