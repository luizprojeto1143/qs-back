import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
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

function App() {
  return (
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
          <Route path="settings" element={<Settings />} />
          {/* Add other routes here */}
        </Route>

        {/* RH Routes */}
        <Route path="/rh" element={<RHLayout />}>
          <Route index element={<RHDashboard />} />
          <Route path="collaborators" element={<CollaboratorsList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="history" element={<VisitHistory />} />
          {/* Reuse components where possible */}
        </Route>
        {/* Mobile App Routes */}
        <Route path="/app" element={<MobileLayout />}>
          <Route index element={<MobileHome />} />
          <Route path="schedule" element={<MobileSchedule />} />
          <Route path="request" element={<MobileSchedule />} />
          <Route path="profile" element={<MobileProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
