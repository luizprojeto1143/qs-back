import { Router } from 'express';
import * as companyController from '../controllers/companyController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public
router.get('/public/areas/:companyId', rateLimiter, companyController.listPublicAreas);

// Protected
router.use(authenticateToken);

router.get('/structure', companyController.getStructure);

router.get('/', requireRole(['MASTER']), companyController.listCompanies);
router.post('/', requireRole(['MASTER']), companyController.createCompany);
router.put('/:id', requireRole(['MASTER', 'RH']), companyController.updateCompany);
router.delete('/:id', requireRole(['MASTER']), companyController.deleteCompany);

router.get('/sectors', companyController.listSectors);
router.post('/sectors', requireRole(['MASTER', 'RH']), companyController.createSector);
router.put('/sectors/:id', requireRole(['MASTER', 'RH']), companyController.updateSector);

router.get('/areas', companyController.listAreas);
router.post('/areas', requireRole(['MASTER', 'RH']), companyController.createArea);
router.put('/areas/:id', requireRole(['MASTER', 'RH']), companyController.updateArea);

export default router;
