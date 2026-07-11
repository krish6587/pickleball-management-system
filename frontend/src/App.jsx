import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import CreateTournament from './pages/CreateTournament';
import TournamentDetail from './pages/TournamentDetail';
import NotFound from './pages/NotFound';
import AIChatbot from './components/AIChatbot';
import SpotlightBackground from '@/components/ui/spotlight-background';
import DemoOne from '@/components/ui/demo';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user && user.role === 'Admin' ? children : <Navigate to="/" />;
};

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen-full">
        <div className="spinner-ring"></div>
      </div>
    );
  }

  // Show global navbar on all pages except the public landing page when logged out
  const showNavbar = user || location.pathname !== '/';

  return (
    <SpotlightBackground>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {showNavbar && <Navbar />}
        <main style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/demo" element={<DemoOne />} />
            <Route path="/" element={user ? <Dashboard /> : <Landing />} />
            <Route
              path="/create-tournament"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <CreateTournament />
                  </AdminRoute>
                </PrivateRoute>
              }
            />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <AIChatbot />
      </div>
    </SpotlightBackground>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
