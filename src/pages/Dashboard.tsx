import { useSession, signOut } from '../lib/auth-client';
import { Navigate } from 'react-router-dom';

export function Dashboard() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {session.user.name || session.user.email}!</span>
          <button onClick={handleSignOut} className="signout-btn">
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>📊 Analytics</h2>
            <p>View your performance metrics and statistics</p>
            <div className="card-content">
              <div className="stat">
                <span className="stat-label">Total Tasks:</span>
                <span className="stat-value">0</span>
              </div>
              <div className="stat">
                <span className="stat-label">Completed:</span>
                <span className="stat-value">0</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>✅ Tasks</h2>
            <p>Manage your tasks and todos</p>
            <div className="card-content">
              <p>No tasks yet. Start by creating your first task!</p>
              <button className="primary-btn">Add Task</button>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>📁 Projects</h2>
            <p>Organize your work into projects</p>
            <div className="card-content">
              <p>No projects yet. Create a project to get started!</p>
              <button className="primary-btn">New Project</button>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>⚙️ Settings</h2>
            <p>Configure your account and preferences</p>
            <div className="card-content">
              <div className="setting-item">
                <span>Email: {session.user.email}</span>
              </div>
              <button className="secondary-btn">Edit Profile</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}