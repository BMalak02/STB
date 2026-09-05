import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { HTTP_STATUS } from '../constants/http';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  // Support for development / mock sandbox tokens
  if (token && token.startsWith('mock-')) {
    (req as any).user = {
      id: '6a9c010ba4e93ab8229b63f3',
      email: 'client@stb.com.tn',
      role: 'user',
    };
    return next();
  }

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Invalid or expired token' });
  }
};
