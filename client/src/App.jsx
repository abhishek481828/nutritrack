import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { useAuth } from './context/AuthContext';
import { useAlert } from './context/AlertContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import Alert from './components/Alert';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FoodUpload from './pages/FoodUpload';
import AddFood from './pages/AddFood';
import FoodLogs from './pages/FoodLogs';
import Recommendations from './pages/Recommendations';
import Profile from './pages/Profile';
import Activity from './pages/Activity';

// Show chatbot only when user is logged in
const ChatbotGuard = () => {
  const { user } = useAuth();
  return user ? <Chatbot /> : null;
};

// Global alert display
const GlobalAlert = () => {
  const { alert, dismissAlert } = useAlert();
  if (!alert) return null;
  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
      <Alert
        type={alert.type}
        message={alert.message}
        onDismiss={dismissAlert}
      />
    </div>
  );
};

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen"><p>Loading…</p></div>;
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};

function AppContent() {
  const location = useLocation();

  return (
    <>
      <GlobalAlert />
      <Navbar />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-food"
              element={
                <PrivateRoute>
                  <AddFood />
                </PrivateRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <PrivateRoute>
                  <FoodUpload />
                </PrivateRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <PrivateRoute>
                  <FoodLogs />
                </PrivateRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <PrivateRoute>
                  <Recommendations />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <PrivateRoute>
                  <Activity />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      {/* Floating chatbot — visible on all pages when authenticated */}
      <ChatbotGuard />
    </>
  );
}

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </AlertProvider>
  );
}

export default App;
