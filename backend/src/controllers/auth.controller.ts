import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { HTTP_STATUS } from '../constants/http';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing fields' });
        return;
      }
      const result = await this.authService.register(email, password, name);
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing email or password' });
        return;
      }
      const result = await this.authService.login(email, password);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // req.user added by auth middleware
      const userId = (req as any).user?.id;
      const user = await this.authService.getUserProfile(userId);
      res.status(HTTP_STATUS.OK).json(user);
    } catch (error) {
      next(error);
    }
  };
}
