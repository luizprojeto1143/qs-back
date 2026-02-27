import { Router } from 'express';
import * as companyController from '../controllers/companyController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public Routes (No Auth)
router.get('/public/areas/:companyId', rateLimiter, companyController.listPublicAreas);
router.get('/public/shifts/:companyId', rateLimiter, companyController.listPublicShifts);

// Protected
router.use(authenticateToken);

router.get('/structure', companyController.getStructure);

router.get('/companies', companyController.listCompanies);
router.post('/companies', requireRole(['MASTER']), companyController.createCompany);
router.put('/companies/:id', requireRole(['MASTER', 'RH']), companyController.updateCompany);
router.delete('/companies/:id', requireRole(['MASTER']), companyController.deleteCompany);

router.get('/sectors', companyController.listSectors);
router.post('/sectors', requireRole(['MASTER', 'RH']), companyController.createSector);
router.put('/sectors/:id', requireRole(['MASTER', 'RH']), companyController.updateSector);
router.delete('/sectors/:id', requireRole(['MASTER', 'RH']), companyController.deleteSector);

router.get('/areas', companyController.listAreas);
router.get('/areas/company/:companyId', companyController.listAreas);
router.post('/areas', requireRole(['MASTER', 'RH']), companyController.createArea);
router.put('/areas/:id', requireRole(['MASTER', 'RH']), companyController.updateArea);
router.delete('/areas/:id', requireRole(['MASTER', 'RH']), companyController.deleteArea);

export default router;
