import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/error.middleware';
import router from './routes';
import { swaggerUi, swaggerSpec } from './config/swagger';

dotenv.config();

const app: Application = express();

// Standard Middlewares
app.use(helmet());
app.use(cors({ origin: '*' })); // Customize origins in prod
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base Routes
app.use('/api', router);

// Error Handling Middleware (must be after routes)
app.use(errorHandler);

export default app;
