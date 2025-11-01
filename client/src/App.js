import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RODashboard from './pages/RODashboard';
import ClientDetailsPage from './pages/ClientDetails';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import BecomeClientPage from './pages/BecomeClientPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/become-client" element={<BecomeClientPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/dashboard" element={<RODashboard />} />
          <Route path="/client-details" element={<ClientDetailsPage />} />
          <Route path="/client-details/:clientId" element={<ClientDetailsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
