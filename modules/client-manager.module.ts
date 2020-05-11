// Interfaces
import { Client } from '../interfaces/client.interface';

// Constants
import { SOCKET } from '../constants/socket.constant';

export class ClientManager {

    private clients: Client[] = [];

    public addClient(client: Client) {
        this.clients.push(client);

        client.send(JSON.stringify({
            type: SOCKET.EVENT_TYPE.SOCKET_CONNECTED,
            clientId: client.clientId,
        }));
    }

    public handleMessage(client: Client, message: any) {
        switch (message.type) {
            case SOCKET.EVENT_TYPE.JOIN_ROOM: {
                this.emit(client, {
                    clientId: client.clientId,
                    roomId: message.roomId,
                    type: SOCKET.EVENT_TYPE.PEER_CONNECTED,
                });
                break;
            }
            case SOCKET.EVENT_TYPE.PEER_MESSAGE: {
                this.emit(client, message);
                break;
            }
            case SOCKET.EVENT_TYPE.MUTE: {
                this.emit(client, message);
                break;
            }
            case SOCKET.EVENT_TYPE.UNMUTE: {
                break;
            }
            default: {
                break;
            }
        }
    }

    public removeClient(client: Client) {
        this.emit(client, {
            type: SOCKET.EVENT_TYPE.PEER_DISCONNECTED,
            clientId: client.clientId,
        });
        this.clients = this.clients.filter(c => c !== client);
    }

    private emit(client: Client, data: any) {
        if (this.clients.length) {
            for (const item of this.clients) {
                if (item.clientId !== client.clientId) {
                    item.send(JSON.stringify(data));
                }
            }
        }
    }
}
