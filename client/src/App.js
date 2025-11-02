import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutUsPage from './pages/AboutUsPage';
import RODashboard from './pages/RODashboard';
import ClientDetailsPage from './pages/ClientDetails';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import BecomeClientPage from './pages/BecomeClientPage';
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
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/dashboard"
              element={(
                <RequireAuth allowedRoles={['company_rep']}>
                  <RODashboard />
                </RequireAuth>
              )}
            />
            <Route
              path="/client-details"
              element={(
                <RequireAuth allowedRoles={['company_rep']}>
                  <ClientDetailsPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/client-details/:clientId"
              element={(
                <RequireAuth allowedRoles={['company_rep']}>
                  <ClientDetailsPage />
                </RequireAuth>
              )}
            />
          </Routes>
        </ClientIntakeProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
