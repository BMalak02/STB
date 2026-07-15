import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger';

export class SocketManager {
  private io: Server;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Customize in production
        methods: ['GET', 'POST'],
      },
    });
  }

  public init(): void {
    logger.info('Initializing Socket.io...');

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('ping', (data) => {
        logger.debug(`Ping from ${socket.id}: ${JSON.stringify(data)}`);
        socket.emit('pong', { timestamp: new Date() });
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public getIO(): Server {
    return this.io;
  }
}
