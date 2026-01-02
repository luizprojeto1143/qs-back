import { Router } from 'express';
import { qsScoreController } from '../controllers/qsScoreController';
import { systemSettingsController } from '../controllers/systemSettingsController';
import { complaintController } from '../controllers/complaintController';
import { mediationController } from '../controllers/mediationController';
import { workScheduleController, dayOffController } from '../controllers/workScheduleController';
import { aiController } from '../controllers/aiController';
import { decisionController } from '../controllers/decisionController';
import { indicatorsController } from '../controllers/indicatorsController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// ============================================
// QS SCORE
// ============================================
router.get('/qs-score/company/:companyId', requireRole(['MASTER', 'RH']), qsScoreController.getCompanyScore);
router.get('/qs-score/area/:areaId', requireRole(['MASTER', 'RH']), qsScoreController.getAreaScore);
router.get('/qs-score/risk-map/:companyId', requireRole(['MASTER', 'RH']), qsScoreController.getRiskMap);
router.post('/qs-score/simulate', requireRole(['MASTER']), qsScoreController.simulateImpact);
router.post('/qs-score/recalculate/:companyId', requireRole(['MASTER']), qsScoreController.recalculateCompanyScores);

// ============================================
// SYSTEM SETTINGS (Toggle de funcionalidades)
// ============================================
router.get('/settings/:companyId', requireRole(['MASTER', 'RH']), systemSettingsController.getSettings);
router.put('/settings/:companyId', requireRole(['MASTER']), systemSettingsController.updateSettings);
router.patch('/settings/:companyId/toggle/:feature', requireRole(['MASTER']), systemSettingsController.toggleFeature);

// ============================================
// DENÚNCIAS
// ============================================
router.post('/complaints', complaintController.create);
router.get('/complaints/:companyId', requireRole(['MASTER']), complaintController.list);
router.get('/complaint/:id', requireRole(['MASTER']), complaintController.get);
router.patch('/complaint/:id/translate', requireRole(['MASTER']), complaintController.translate);
router.patch('/complaint/:id/validate', requireRole(['MASTER']), complaintController.validate);
router.patch('/complaint/:id/forward', requireRole(['MASTER']), complaintController.forwardToRH);
router.patch('/complaint/:id/discard', requireRole(['MASTER']), complaintController.discard);
router.patch('/complaint/:id/resolve', requireRole(['MASTER', 'RH']), complaintController.resolve);

// ============================================
// MEDIAÇÃO
// ============================================
router.post('/mediations', requireRole(['MASTER', 'RH']), mediationController.create);
router.get('/mediations/:companyId', requireRole(['MASTER', 'RH']), mediationController.list);
router.get('/mediation/:id', requireRole(['MASTER', 'RH']), mediationController.get);
router.put('/mediation/:id', requireRole(['MASTER', 'RH']), mediationController.update);
router.patch('/mediation/:id/conclude', requireRole(['MASTER', 'RH']), mediationController.conclude);

// ============================================
// HISTÓRICO DE DECISÕES
// ============================================
router.get('/decisions/:entityType/:entityId', requireRole(['MASTER', 'RH']), decisionController.getHistory);

// ============================================
// INDICADORES INTERNOS (CENSO)
// ============================================
router.get('/metrics/diversity/:companyId', requireRole(['MASTER', 'RH']), indicatorsController.getDiversityCensus);
router.get('/metrics/retention/:companyId', requireRole(['MASTER', 'RH']), indicatorsController.getPcdRetention);

// ============================================
// IA ANALÍTICA
// ============================================
router.post('/ai/analyze-area/:areaId', requireRole(['MASTER']), aiController.analyzeArea);
router.get('/ai/alerts/:companyId', requireRole(['MASTER', 'RH']), aiController.getAlerts);
router.patch('/ai/alert/:id/validate', requireRole(['MASTER']), aiController.validateAlert);
router.patch('/ai/alert/:id/send-rh', requireRole(['MASTER']), aiController.sendAlertToRH);
router.get('/ai/priorities/:companyId', requireRole(['MASTER']), aiController.getPriorities);
router.get('/ai/summary/:companyId', requireRole(['MASTER', 'RH']), aiController.getExecutiveSummary);

// ============================================
// ESCALA DE TRABALHO
// ============================================
router.get('/work-schedule/:collaboratorId', workScheduleController.get);
router.put('/work-schedule/:collaboratorId', requireRole(['MASTER', 'RH']), workScheduleController.upsert);
router.get('/work-schedules/company/:companyId', requireRole(['MASTER', 'RH']), workScheduleController.listByCompany);
router.get('/work-schedule/:collaboratorId/days-off', workScheduleController.getNextDaysOff);

// ============================================
// FOLGAS
// ============================================
router.post('/days-off', requireRole(['MASTER', 'RH']), dayOffController.create);
router.get('/days-off/collaborator/:collaboratorId', dayOffController.listByCollaborator);
router.delete('/days-off/:id', requireRole(['MASTER', 'RH']), dayOffController.delete);

export default router;

