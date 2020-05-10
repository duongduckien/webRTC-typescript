import * as express from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as socketio from 'socket.io';
import * as http from 'http';

class Server {

    public app: express.Application;
    public io: SocketIO.Server;
    private server: http.Server;
    private allowedOrigins = ['http://localhost:4201'];
    private port = process.env.PORT || 3000;

    public static bootstrap(): Server {
        return new Server();
    }

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketio().listen(this.server);
        this.config();
        this.setupSocket();
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

    private setupSocket() {
        this.io.on('connection', (socket: SocketIO.Socket) => {
            console.log(`Socket ${socket.id} connected`);

            socket.on('PEER_MESSAGE', (data: any) => {
                socket.broadcast.emit('PEER_MESSAGE', data);
            });

            socket.on('JOIN_ROOM', (data: any) => {
                socket.broadcast.emit('PEER_CONNECTED', data);
            });

            socket.on('disconnect', function () {
                socket.broadcast.emit('PEER_DISCONNECTED', {
                    id: socket.id
                });
            });
        });
    }
}

Server.bootstrap();