import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RODashboard from './pages/RODashboard';
import ClientDetailsPage from './pages/ClientDetails';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { AuthProvider } from './context/AuthContext';
import { ResumeSubmissionProvider } from './context/ResumeSubmissionContext';
import ResumeSubmissionModal from './components/ui/resume/ResumeSubmissionModal';

function App() {
  return (
    <AuthProvider>
      <ResumeSubmissionProvider>
        <Router>
          <>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/dashboard" element={<RODashboard />} />
              <Route path="/client-details" element={<ClientDetailsPage />} />
              <Route path="/client-details/:clientId" element={<ClientDetailsPage />} />
            </Routes>
            <ResumeSubmissionModal />
          </>
        </Router>
      </ResumeSubmissionProvider>
    </AuthProvider>
  );
}

export default App;
