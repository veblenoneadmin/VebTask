import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './lib/auth-client';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { BrainDump } from './pages/BrainDump';
import MainLayout from './components/Layout/MainLayout';

function App() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 rounded-lg">
          <div className="text-xl font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route 
            path="/login" 
            element={session ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={session ? <Navigate to="/dashboard" replace /> : <Register />} 
          />
          <Route 
            path="/*" 
            element={session ? <MainLayout /> : <Navigate to="/login" replace />}
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="brain-dump" element={<BrainDump />} />
            <Route path="timer" element={<div className="text-center p-8">Timer - Coming Soon</div>} />
            <Route path="tasks" element={<div className="text-center p-8">Tasks - Coming Soon</div>} />
            <Route path="calendar" element={<div className="text-center p-8">Calendar - Coming Soon</div>} />
            <Route path="projects" element={<div className="text-center p-8">Projects - Coming Soon</div>} />
            <Route path="timesheets" element={<div className="text-center p-8">Time Logs - Coming Soon</div>} />
            <Route path="clients" element={<div className="text-center p-8">Clients - Coming Soon</div>} />
            <Route path="invoices" element={<div className="text-center p-8">Invoices - Coming Soon</div>} />
            <Route path="expenses" element={<div className="text-center p-8">Expenses - Coming Soon</div>} />
            <Route path="reports" element={<div className="text-center p-8">Reports - Coming Soon</div>} />
            <Route path="settings" element={<div className="text-center p-8">Settings - Coming Soon</div>} />
          </Route>
          <Route 
            path="/" 
            element={
              session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App
