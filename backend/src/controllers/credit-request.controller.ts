import { Request, Response, NextFunction } from 'express';
import { CreditRequestService } from '../services/credit-request.service';
import { HTTP_STATUS } from '../constants/http';

export class CreditRequestController {
  private creditRequestService = new CreditRequestService();

  createCreditRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { type, amount, duration } = req.body;
      if (!type || !amount || !duration) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing fields' });
        return;
      }
      const request = await this.creditRequestService.createCreditRequest(userId, { type, amount, duration });
      res.status(HTTP_STATUS.CREATED).json(request);
    } catch (error) {
      next(error);
    }
  };

  getUserCreditRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const requests = await this.creditRequestService.getUserCreditRequests(userId);
      res.status(HTTP_STATUS.OK).json(requests);
    } catch (error) {
      next(error);
    }
  };

  getActiveCreditRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const request = await this.creditRequestService.getActiveCreditRequest(userId);
      res.status(HTTP_STATUS.OK).json(request);
    } catch (error) {
      next(error);
    }
  };

  getCreditRequestDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const request = await this.creditRequestService.getCreditRequestDetails(userId, id);
      res.status(HTTP_STATUS.OK).json(request);
    } catch (error) {
      next(error);
    }
  };

  getAgentCreditRequestDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const request = await this.creditRequestService.getAgentCreditRequestDetails(id);
      res.status(HTTP_STATUS.OK).json(request);
    } catch (error) {
      next(error);
    }
  };

  updateDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('📥 [UPLOAD RECEIVED]:', {
        hasFile: !!(req as any).file,
        file: (req as any).file ? { filename: (req as any).file.filename, size: (req as any).file.size, path: (req as any).file.path } : null,
        body: req.body,
        contentType: req.headers['content-type'],
      });
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const docType = req.body.docType || req.body.type || (req as any).file?.fieldname || 'cin';

      let filePath = req.body.path;
      let fileSize = req.body.size;
      let diskPath = req.body.path;

      if ((req as any).file) {
        const file = (req as any).file;
        diskPath = file.path;
        filePath = `/uploads/${file.filename}`;
        fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} Mo`;
      }

      if (!docType) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing docType' });
        return;
      }

      const request = await this.creditRequestService.updateDocuments(
        userId,
        id,
        docType,
        fileSize || '1.8 Mo',
        diskPath || filePath || `/uploads/${docType}_sample.pdf`
      );

      res.status(HTTP_STATUS.OK).json(request);
    } catch (error) {
      next(error);
    }
  };

  evaluateScore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const request = await this.creditRequestService.evaluateScore(userId, id);
      res.status(HTTP_STATUS.OK).json(request);
    } catch (error) {
      next(error);
    }
  };

  sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const result = await this.creditRequestService.sendOtp(userId, id);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  signContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const { otpCode, pathDrawing } = req.body;
      if (!otpCode || !pathDrawing) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing otpCode or pathDrawing' });
        return;
      }
      const request = await this.creditRequestService.signContract(userId, id, otpCode, pathDrawing);
      res.status(HTTP_STATUS.OK).json(request);
    } catch (error) {
      next(error);
    }
  };

  updatePersonalData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const request = await this.creditRequestService.updatePersonalData(userId, id, req.body);
      res.status(HTTP_STATUS.OK).json(request);
    } catch (error) {
      next(error);
    }
  };

  cancelCreditRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const result = await this.creditRequestService.cancelCreditRequest(userId, id);
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAllCreditRequestsForAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requests = await this.creditRequestService.getAllCreditRequestsForAgent();
      res.status(HTTP_STATUS.OK).json(requests);
    } catch (error) {
      next(error);
    }
  };

  updateCreditRequestStatusByAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      if (!status) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Missing status field' });
        return;
      }
      const request = await this.creditRequestService.updateCreditRequestStatusByAgent(id, status, notes);
      res.status(HTTP_STATUS.OK).json(request);
    } catch (error) {
      next(error);
    }
  };
}
