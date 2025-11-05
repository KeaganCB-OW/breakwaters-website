import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutUsPage from './pages/AboutUsPage';
import RODashboard from './pages/RODashboard';
import ClientDetailsPage from './pages/ClientDetails';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import BecomeClientPage from './pages/BecomeClientPage';
import SharedClientDetailsPage from './pages/SharedClientDetails';
import RegisterBusinessPage from './pages/RegisterBusinessPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import { AuthProvider } from './context/AuthContext';
import { ClientIntakeProvider } from './context/ClientIntakeContext';
import RequireAuth from './components/routing/RequireAuth';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ClientIntakeProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/become-client" element={<BecomeClientPage />} />
            <Route path="/register-business" element={<RegisterBusinessPage />} />
            <Route path="/business/profile" element={<CompanyProfilePage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/rod/*"
              element={(
                <RequireAuth allowedRoles={['recruitment_officer']}>
                  <RODashboard />
                </RequireAuth>
              )}
            />
            <Route path="/dashboard/*" element={<Navigate to="/rod" replace />} />
            <Route
              path="/client-details"
              element={(
                <RequireAuth allowedRoles={['recruitment_officer']}>
                  <ClientDetailsPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/client-details/:clientId"
              element={(
                <RequireAuth allowedRoles={['recruitment_officer']}>
                  <ClientDetailsPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/ro/clients/:clientId"
              element={(
                <RequireAuth allowedRoles={['recruitment_officer']}>
                  <ClientDetailsPage />
                </RequireAuth>
              )}
            />
            <Route path="/share/clients/:clientId" element={<SharedClientDetailsPage />} />
          </Routes>
        </ClientIntakeProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
