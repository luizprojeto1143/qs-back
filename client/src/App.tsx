import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { Toaster } from 'sonner';
import DashboardLayout from './layouts/DashboardLayout';
import VisitRecording from './pages/VisitRecording';
import Pendencies from './pages/Pendencies';
import DashboardHome from './pages/DashboardHome';
import CollaboratorsList from './pages/CollaboratorsList';
import Feed from './pages/Feed';
import Settings from './pages/Settings';
import RHLayout from './layouts/RHLayout';
import RHDashboard from './pages/RHDashboard';
import Reports from './pages/Reports';
import VisitHistory from './pages/VisitHistory';
import MobileLayout from './layouts/MobileLayout';
import MobileHome from './pages/mobile/MobileHome';
import MobileSchedule from './pages/mobile/MobileSchedule';
import MobileProfile from './pages/mobile/MobileProfile';
import Schedules from './pages/Schedules';
import CompaniesList from './pages/settings/CompaniesList';
import SectorsList from './pages/settings/SectorsList';
import AreasList from './pages/settings/AreasList';
import ReportViewer from './pages/ReportViewer';
import InclusionDiagnosisEditor from './pages/InclusionDiagnosisEditor';
import FeedCategories from './pages/settings/FeedCategories';
import TermsOfUse from './pages/settings/TermsOfUse';
import ShiftsList from './pages/settings/ShiftsList';
import Availability from './pages/settings/Availability';
import { UsersList } from './pages/settings/UsersList';
import QRCodeGenerator from './pages/settings/QRCodeGenerator';
import CollaboratorRegistration from './pages/public/CollaboratorRegistration';
import { CompanyProvider } from './contexts/CompanyContext';
import LibrasAvailability from './pages/settings/LibrasAvailability';
import LibrasCentral from './pages/LibrasCentral';
import SpecialistSettings from './pages/settings/SpecialistSettings';
import CompanyHistory from './pages/CompanyHistory';
import PDIManagement from './pages/PDIManagement';
import UniversityManagement from './pages/master/UniversityManagement';
import CourseCatalog from './pages/university/CourseCatalog';
import CoursePlayer from './pages/university/CoursePlayer';
import QuizPlayer from './pages/university/QuizPlayer';
import UniversityReports from './pages/university/UniversityReports';
import Certificates from './pages/university/Certificates';

function App() {
  console.log('QS System Version: Libras Central (v10.12 - Seed Deps Fix)');
  return (
    <CompanyProvider>
      <Toaster position="top-right" richColors />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="visits" element={<VisitRecording />} />
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
            <Route path="university" element={<UniversityManagement />} />
            <Route path="pdi" element={<PDIManagement />} />
          </Route>

          <Route path="/register/collaborator" element={<CollaboratorRegistration />} />

          {/* RH Routes */}
          <Route path="/rh" element={<RHLayout />}>
            <Route index element={<RHDashboard />} />
            <Route path="collaborators" element={<CollaboratorsList />} />
            <Route path="reports" element={<Reports />} />
            <Route path="history" element={<VisitHistory />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="history" element={<VisitHistory />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="libras" element={<LibrasCentral />} />
            <Route path="university-reports" element={<UniversityReports />} />
          </Route>
          {/* Mobile App Routes */}
          <Route path="/app" element={<MobileLayout />}>
            <Route index element={<MobileHome />} />
            <Route path="schedule" element={<MobileSchedule />} />
            <Route path="request" element={<MobileSchedule />} />
            <Route path="profile" element={<MobileProfile />} />
            <Route path="libras" element={<LibrasCentral />} />
            <Route path="university" element={<CourseCatalog />} />
            <Route path="university/course/:id" element={<CoursePlayer />} />
            <Route path="university/quiz/:id" element={<QuizPlayer />} />
            <Route path="university/certificates" element={<Certificates />} />
          </Route>
        </Routes>
      </Router>
    </CompanyProvider>
  );
}

export default App;
