import { v4 as uuid } from 'uuid';
import { IncomingMessage } from 'http';
import * as WebSocket from 'ws';

// Interfaces
import { Client } from '../interfaces/client.interface';

const acceptForwardedFor = process.env.WS_BEHIND_PROXY === 'true' || process.env.WS_BEHIND_PROXY === 'yes';

export class WSClient implements Client {
    
    readonly clientId = uuid();
    readonly firstSeen = new Date();
    lastSeen = new Date();
    readonly remoteAddress: string;
    channels = new Set<string>();

    constructor(
        private ws: WebSocket,
        req: IncomingMessage
    ) {
        const address = acceptForwardedFor && req.headers['x-forwarded-for']
                        ? req.headers['x-forwarded-for']
                        : req.connection.remoteAddress;
        this.remoteAddress = Array.isArray(address) ? address[0] : address;
    }

    send(data: string) {
        if (this.ws.readyState !== 1) {
            return;
        }
        this.ws.send(data);
    }

    get readyState() {
        return this.ws.readyState;
    }

    close() {
        this.ws.close();
    }
}
