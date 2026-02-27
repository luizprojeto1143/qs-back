import { Router } from 'express';
import * as specialistController from '../controllers/specialistController';
import * as specialtyController from '../controllers/specialtyController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

// Specialist Routes
router.get('/', specialistController.listSpecialists);
router.post('/', requireRole(['MASTER', 'RH']), specialistController.createSpecialist);
router.put('/:id', requireRole(['MASTER', 'RH']), specialistController.updateSpecialist);
router.delete('/:id', requireRole(['MASTER', 'RH']), specialistController.deleteSpecialist);

// Specialty Routes
router.get('/specialties', specialtyController.listSpecialties);
router.post('/specialties', requireRole(['MASTER', 'RH']), specialtyController.createSpecialty);
router.delete('/specialties/:id', requireRole(['MASTER', 'RH']), specialtyController.deleteSpecialty);

export default router;
