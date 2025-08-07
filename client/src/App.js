import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ClientDashboard from './components/dashboard/ClientDashboard';
import RecruitmentOfficerDashboard from './components/dashboard/RecruitmentOfficerDashboard';
import CompanyDashboard from './components/dashboard/CompanyDashboard';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<RegisterForm />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/officer/dashboard" element={<RecruitmentOfficerDashboard />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
