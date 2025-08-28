import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './lib/auth-client';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; 
import Dashboard from './pages/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

function App() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/register" 
            element={!session ? <RegisterPage /> : <Navigate to="/dashboard" />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={session ? <Dashboard /> : <Navigate to="/login" />} 
          />
          
          {/* Default redirect */}
          <Route 
            path="/" 
            element={<Navigate to={session ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
