import * as express from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as WebSocket from 'ws';

// Modules
import { ClientManager } from './modules/client-manager.module';
import { WSClient } from './modules/ws-client.module';

class Server {

    private app: express.Application;
    private server: http.Server;
    private allowedOrigins = ['http://localhost:4201'];
    private port = process.env.PORT || 3000;
    private wss: WebSocket.Server;
    private clientManager: ClientManager;

    public static bootstrap(): Server {
        return new Server();
    }

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.config();
        this.initWebsocket();
    }

    private config() {
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            const origin = req.header('Origin');

            for (let o of this.allowedOrigins) {
                if (o === origin) {
                    res.header('Access-Control-Allow-Origin', origin);
                    break;
                }
            }
        });

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.app.use(morgan('dev'));

        this.app.get('/', (req, res) => {
            res.json({
                message: 'This is the signalling server',
            });
        });

        this.server.listen(this.port, () => {
            console.log(`Server is listening on port ${this.port}`);
        });
    }

    private initWebsocket() {
        const server = this.server;
        this.wss = new WebSocket.Server({ server });
        this.clientManager = new ClientManager();

        this.wss.on('connection', (ws, req) => {
            const client = new WSClient(ws, req);
            this.clientManager.addClient(client);

            ws.on('message', (data: string) => {
                try {
                    const message = JSON.parse(data);
                    this.clientManager.handleMessage(client, message);
                } catch (e) {
                    console.log(e);
                }
            });

            ws.on('close', () => {
                try {
                    this.clientManager.removeClient(client);
                } catch (e) {
                    console.log(e);
                }
            });

            ws.on('error', (error) => {
                console.log(error);
            });
        });
    }
}

Server.bootstrap();