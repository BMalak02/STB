import { Router } from 'express';
import { CreditRequestController } from '../controllers/credit-request.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();
const controller = new CreditRequestController();

router.use(authMiddleware);

router.post('/', controller.createCreditRequest);
router.get('/', controller.getUserCreditRequests);

// ⚠️ IMPORTANT: Static routes MUST be declared before dynamic /:id routes
router.get('/active', controller.getActiveCreditRequest);
router.get('/agent/all', controller.getAllCreditRequestsForAgent);
router.get('/agent/:id', controller.getAgentCreditRequestDetails);

router.get('/:id', controller.getCreditRequestDetails);
router.put('/:id/documents', uploadMiddleware.single('file'), controller.updateDocuments);
router.post('/:id/documents', uploadMiddleware.single('file'), controller.updateDocuments);
router.put('/:id/personal-data', controller.updatePersonalData);
router.post('/:id/personal-data', controller.updatePersonalData);
router.post('/:id/score', controller.evaluateScore);
router.post('/:id/send-otp', controller.sendOtp);
router.put('/:id/status', controller.updateCreditRequestStatusByAgent);
router.delete('/:id', controller.cancelCreditRequest);

export default router;
