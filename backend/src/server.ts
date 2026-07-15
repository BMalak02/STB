import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { logger } from './config/logger';
import { SocketManager } from './sockets/socket.manager';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
const socketManager = new SocketManager(server);
socketManager.init();

// Connect Database & Start Server
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}).catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
