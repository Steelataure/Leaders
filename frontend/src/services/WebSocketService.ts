import SockJS from 'sockjs-client';
import { Client, Message } from '@stomp/stompjs';

const SOCKET_URL = '/ws';

class WebSocketService {
    private client: Client;
    private connected: boolean = false;

    constructor() {
        this.client = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            onConnect: () => {
                this.connected = true;
                console.log('Connected to WebSocket');
            },
            onDisconnect: () => {
                this.connected = false;
                console.log('Disconnected from WebSocket');
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
                    this.doSubscribe(sessionId, callback);
                }
            }, 100);
        } else {
            this.doSubscribe(sessionId, callback);
        }
    }

    private doSubscribe(sessionId: string, callback: (session: any) => void) {
        console.log(`Attempting to subscribe to /topic/session/${sessionId}`);
        this.client.subscribe(`/topic/session/${sessionId}`, (message: Message) => {
            console.log(`Received message on /topic/session/${sessionId}:`, message.body);
            if (message.body) {
                const session = JSON.parse(message.body);
                callback(session);
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
