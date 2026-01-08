import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Suspense, lazy } from 'react';
import { CompanyProvider } from './contexts/CompanyContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ReloadPrompt } from './components/ReloadPrompt';
import { TermsEnforcer } from './components/TermsEnforcer';

// Lazy Load Pages to reduce initial bundle size
const Login = lazy(() => import('./pages/Login'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const VisitRecording = lazy(() => import('./pages/VisitRecording'));
const Pendencies = lazy(() => import('./pages/Pendencies'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const CollaboratorsList = lazy(() => import('./pages/CollaboratorsList'));
const Feed = lazy(() => import('./pages/Feed'));
const Settings = lazy(() => import('./pages/Settings'));
const RHLayout = lazy(() => import('./layouts/RHLayout'));
const RHDashboard = lazy(() => import('./pages/RHDashboard'));
const Reports = lazy(() => import('./pages/Reports'));
const VisitHistory = lazy(() => import('./pages/VisitHistory'));
const MobileLayout = lazy(() => import('./layouts/MobileLayout'));
const MobileHome = lazy(() => import('./pages/mobile/MobileHome'));
const MobileWorkSchedule = lazy(() => import('./pages/mobile/MobileWorkSchedule'));
const MobileSchedule = lazy(() => import('./pages/mobile/MobileSchedule'));
const MobileProfile = lazy(() => import('./pages/mobile/MobileProfile'));
const MobileTeam = lazy(() => import('./pages/mobile/MobileTeam'));
const MobileApprovals = lazy(() => import('./pages/mobile/MobileApprovals'));
const MobileRequestDayOff = lazy(() => import('./pages/mobile/MobileRequestDayOff'));
const MobileComplaints = lazy(() => import('./pages/mobile/MobileComplaints'));

const RHInclusion = lazy(() => import('./pages/RHInclusion'));
const RHComplaints = lazy(() => import('./pages/RHComplaints'));
const Schedules = lazy(() => import('./pages/Schedules'));
const CompaniesList = lazy(() => import('./pages/settings/CompaniesList'));
const SectorsList = lazy(() => import('./pages/settings/SectorsList'));
const AreasList = lazy(() => import('./pages/settings/AreasList'));
const ReportViewer = lazy(() => import('./pages/ReportViewer'));
const InclusionDiagnosisEditor = lazy(() => import('./pages/InclusionDiagnosisEditor'));
const FeedCategories = lazy(() => import('./pages/settings/FeedCategories'));
const TermsOfUse = lazy(() => import('./pages/settings/TermsOfUse'));
const Availability = lazy(() => import('./pages/settings/Availability'));
const ShiftsList = lazy(() => import('./pages/settings/ShiftsList'));
const PDIManagement = lazy(() => import('./pages/PDIManagement'));
const UsersList = lazy(() => import('./pages/settings/UsersList').then(module => ({ default: module.UsersList }))); // Handle named export
const QRCodeGenerator = lazy(() => import('./pages/settings/QRCodeGenerator'));
const CollaboratorRegistration = lazy(() => import('./pages/public/CollaboratorRegistration'));
const LibrasAvailability = lazy(() => import('./pages/settings/LibrasAvailability'));
const LibrasCentral = lazy(() => import('./pages/LibrasCentral'));
const SpecialistSettings = lazy(() => import('./pages/settings/SpecialistSettings'));
const CompanyHistory = lazy(() => import('./pages/CompanyHistory'));
const UniversityManagement = lazy(() => import('./pages/master/UniversityManagement'));
const QSScoreDashboard = lazy(() => import('./pages/master/QSScoreDashboard'));
const AIInsightsDashboard = lazy(() => import('./pages/master/AIInsightsDashboard'));
const SystemSettingsPage = lazy(() => import('./pages/master/SystemSettings'));
const ComplaintsCentral = lazy(() => import('./pages/master/ComplaintsCentral'));
const MediationCentral = lazy(() => import('./pages/master/MediationCentral'));
const InternalIndicators = lazy(() => import('./pages/master/InternalIndicators'));
const WorkScheduleManager = lazy(() => import('./pages/master/WorkScheduleManager'));
const CourseCatalog = lazy(() => import('./pages/university/CourseCatalog'));
const CoursePlayer = lazy(() => import('./pages/university/CoursePlayer'));
const QuizPlayer = lazy(() => import('./pages/university/QuizPlayer'));
const UniversityReports = lazy(() => import('./pages/university/UniversityReports'));
const Certificates = lazy(() => import('./pages/university/Certificates'));
const SecuritySettings = lazy(() => import('./pages/settings/SecuritySettings'));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <SocketProvider>
          <Toaster position="top-right" richColors />
          <ErrorBoundary>
            <Router>
              <ReloadPrompt />
              <TermsEnforcer />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Navigate to="/login" replace />} />

                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<DashboardHome />} />
                    <Route path="visits" element={<VisitHistory />} />
                    <Route path="visits/new" element={<VisitRecording />} />
                    <Route path="pendencies" element={<Pendencies />} />
                    <Route path="collaborators" element={<CollaboratorsList />} />

                    <Route path="feed" element={<Feed />} />
                    <Route path="schedules" element={<Schedules />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="report-viewer" element={<ReportViewer />} />
                    <Route path="inclusion-diagnosis" element={<InclusionDiagnosisEditor />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="libras" element={<LibrasCentral />} />

                    {/* Settings Routes */}
                    <Route path="companies" element={<CompaniesList />} />
                    <Route path="sectors" element={<SectorsList />} />
                    <Route path="areas" element={<AreasList />} />
                    <Route path="terms" element={<TermsOfUse />} />
                    <Route path="feed-categories" element={<FeedCategories />} />
                    <Route path="shifts" element={<ShiftsList />} />
                    <Route path="availability" element={<Availability />} />
                    <Route path="libras-availability" element={<LibrasAvailability />} />
                    <Route path="users" element={<UsersList />} />
                    <Route path="qrcode" element={<QRCodeGenerator />} />
                    <Route path="specialists" element={<SpecialistSettings />} />
                    <Route path="history" element={<CompanyHistory />} />
                    <Route path="pdi" element={<PDIManagement />} />
                    <Route path="security" element={<SecuritySettings />} />

                    {/* Master Modules */}
                    <Route path="university" element={<UniversityManagement />} />
                    <Route path="qs-score" element={<QSScoreDashboard />} />
                    <Route path="ai-insights" element={<AIInsightsDashboard />} />
                    <Route path="system-settings" element={<SystemSettingsPage />} />
                    <Route path="complaints" element={<ComplaintsCentral />} />
                    <Route path="mediations" element={<MediationCentral />} />
                    <Route path="indicators" element={<InternalIndicators />} />
                    <Route path="work-schedules" element={<WorkScheduleManager />} />
                  </Route>

                  <Route path="/register/collaborator" element={<CollaboratorRegistration />} />

                  {/* RH Routes */}
                  <Route path="/rh" element={<RHLayout />}>
                    <Route index element={<RHDashboard />} />
                    <Route path="collaborators" element={<CollaboratorsList />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="visits" element={<VisitHistory />} />
                    <Route path="visits/new" element={<VisitRecording />} />
                    <Route path="schedules" element={<Schedules />} />
                    <Route path="libras" element={<LibrasCentral />} />
                    <Route path="university-reports" element={<UniversityReports />} />
                    <Route path="pendencies" element={<Pendencies />} />
                    <Route path="inclusion" element={<RHInclusion />} />
                    <Route path="complaints" element={<RHComplaints />} />
                  </Route>
                  {/* Mobile App Routes */}
                  <Route path="/app" element={<MobileLayout />}>
                    <Route index element={<MobileHome />} />
                    <Route path="schedule" element={<MobileWorkSchedule />} />
                    <Route path="request" element={<MobileSchedule />} />
                    <Route path="dayoff" element={<MobileRequestDayOff />} />
                    <Route path="team" element={<MobileTeam />} />
                    <Route path="approvals" element={<MobileApprovals />} />
                    <Route path="profile" element={<MobileProfile />} />
                    <Route path="libras" element={<LibrasCentral />} />
                    <Route path="university" element={<CourseCatalog />} />
                    <Route path="university/course/:id" element={<CoursePlayer />} />
                    <Route path="university/quiz/:id" element={<QuizPlayer />} />
                    <Route path="university/certificates" element={<Certificates />} />
                    <Route path="complaints" element={<MobileComplaints />} />
                  </Route>
                </Routes>
              </Suspense>
            </Router>
          </ErrorBoundary>
        </SocketProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
