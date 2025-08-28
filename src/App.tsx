import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './lib/auth-client';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { BrainDump } from './pages/BrainDump';
import { Timer } from './pages/Timer';
import { Tasks } from './pages/Tasks';
import { Calendar } from './pages/Calendar';
import { Projects } from './pages/Projects';
import { TimeLogs } from './pages/TimeLogs';
import { Clients } from './pages/Clients';
import { Invoices } from './pages/Invoices';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
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
            <Route path="timer" element={<Timer />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="projects" element={<Projects />} />
            <Route path="timesheets" element={<TimeLogs />} />
            <Route path="clients" element={<Clients />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
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
