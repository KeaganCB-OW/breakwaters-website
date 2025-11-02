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
            <Route path="/dashboard" element={<RODashboard />} />
            <Route path="/client-details" element={<ClientDetailsPage />} />
            <Route path="/client-details/:clientId" element={<ClientDetailsPage />} />
          </Routes>
        </ClientIntakeProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
