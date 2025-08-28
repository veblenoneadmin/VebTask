import { useState } from 'react';
import { useSession, signOut } from '../lib/auth-client';
import { Navigate } from 'react-router-dom';

export function Dashboard() {
  const { data: session, isPending } = useSession();
  const [activeView, setActiveView] = useState('overview');

  if (isPending) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  // Mock data for demonstration
  const stats = {
    totalTasks: 12,
    completedTasks: 8,
    activeTasks: 4,
    totalTimeToday: '4h 32m',
    totalProjects: 3,
    weeklyHours: 28.5
  };

  const recentTasks = [
    { id: 1, title: 'Fix authentication issues', status: 'completed', project: 'VebTask', time: '2h 15m' },
    { id: 2, title: 'Update dashboard UI', status: 'in-progress', project: 'VebTask', time: '1h 45m' },
    { id: 3, title: 'Review client requirements', status: 'pending', project: 'Client Project', time: '0h' },
    { id: 4, title: 'Write project documentation', status: 'pending', project: 'Documentation', time: '0h' },
  ];

  const activeProjects = [
    { id: 1, name: 'VebTask', tasksCount: 8, completedTasks: 5, hoursSpent: 24.5 },
    { id: 2, name: 'Client Project', tasksCount: 3, completedTasks: 2, hoursSpent: 12.0 },
    { id: 3, name: 'Documentation', tasksCount: 1, completedTasks: 1, hoursSpent: 4.0 },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🎉 VebTask</h1>
          <nav className="nav-tabs">
            <button 
              className={activeView === 'overview' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => setActiveView('overview')}
            >
              Overview
            </button>
            <button 
              className={activeView === 'tasks' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => setActiveView('tasks')}
            >
              Tasks
            </button>
            <button 
              className={activeView === 'projects' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => setActiveView('projects')}
            >
              Projects
            </button>
            <button 
              className={activeView === 'reports' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => setActiveView('reports')}
            >
              Reports
            </button>
          </nav>
        </div>
        <div className="user-info">
          <span>Welcome, {session.user.name || session.user.email}!</span>
          <button onClick={handleSignOut} className="signout-btn">
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {activeView === 'overview' && (
          <div className="overview-view">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>{stats.totalTasks}</h3>
                  <p>Total Tasks</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{stats.completedTasks}</h3>
                  <p>Completed</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚀</div>
                <div className="stat-info">
                  <h3>{stats.activeTasks}</h3>
                  <p>Active Tasks</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏰</div>
                <div className="stat-info">
                  <h3>{stats.totalTimeToday}</h3>
                  <p>Today</p>
                </div>
              </div>
            </div>

            <div className="content-grid">
              <div className="content-section">
                <h2>Recent Tasks</h2>
                <div className="task-list">
                  {recentTasks.map(task => (
                    <div key={task.id} className="task-item">
                      <div className="task-status">
                        <span className={`status-badge ${task.status}`}>
                          {task.status === 'completed' ? '✅' : task.status === 'in-progress' ? '🔄' : '⏸️'}
                        </span>
                      </div>
                      <div className="task-details">
                        <h4>{task.title}</h4>
                        <p>{task.project} • {task.time}</p>
                      </div>
                      <div className="task-actions">
                        <button className="action-btn">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="primary-btn">Add New Task</button>
              </div>

              <div className="content-section">
                <h2>Active Projects</h2>
                <div className="project-list">
                  {activeProjects.map(project => (
                    <div key={project.id} className="project-item">
                      <h4>{project.name}</h4>
                      <div className="project-stats">
                        <span>{project.completedTasks}/{project.tasksCount} tasks</span>
                        <span>{project.hoursSpent}h logged</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(project.completedTasks / project.tasksCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="primary-btn">New Project</button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'tasks' && (
          <div className="tasks-view">
            <div className="view-header">
              <h2>Task Management</h2>
              <button className="primary-btn">Add Task</button>
            </div>
            <div className="task-filters">
              <select className="filter-select">
                <option>All Tasks</option>
                <option>Active</option>
                <option>Completed</option>
                <option>Pending</option>
              </select>
              <select className="filter-select">
                <option>All Projects</option>
                <option>VebTask</option>
                <option>Client Project</option>
                <option>Documentation</option>
              </select>
            </div>
            <div className="task-list detailed">
              {recentTasks.map(task => (
                <div key={task.id} className="task-item detailed">
                  <div className="task-checkbox">
                    <input type="checkbox" checked={task.status === 'completed'} readOnly />
                  </div>
                  <div className="task-content">
                    <h4>{task.title}</h4>
                    <p>{task.project}</p>
                  </div>
                  <div className="task-time">
                    <span>{task.time}</span>
                    <button className="timer-btn">▶️</button>
                  </div>
                  <div className="task-actions">
                    <button className="action-btn">Edit</button>
                    <button className="action-btn danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'projects' && (
          <div className="projects-view">
            <div className="view-header">
              <h2>Project Management</h2>
              <button className="primary-btn">New Project</button>
            </div>
            <div className="projects-grid">
              {activeProjects.map(project => (
                <div key={project.id} className="project-card">
                  <h3>{project.name}</h3>
                  <div className="project-metrics">
                    <div className="metric">
                      <span className="metric-value">{project.tasksCount}</span>
                      <span className="metric-label">Total Tasks</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{project.completedTasks}</span>
                      <span className="metric-label">Completed</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{project.hoursSpent}h</span>
                      <span className="metric-label">Time Logged</span>
                    </div>
                  </div>
                  <div className="progress-section">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${(project.completedTasks / project.tasksCount) * 100}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {Math.round((project.completedTasks / project.tasksCount) * 100)}% Complete
                    </span>
                  </div>
                  <div className="project-actions">
                    <button className="secondary-btn">View Tasks</button>
                    <button className="secondary-btn">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'reports' && (
          <div className="reports-view">
            <div className="view-header">
              <h2>Reports & Analytics</h2>
              <select className="filter-select">
                <option>This Week</option>
                <option>This Month</option>
                <option>Last 30 Days</option>
                <option>Custom Range</option>
              </select>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h3>Time Distribution</h3>
                <div className="chart-placeholder">
                  <div className="pie-chart">
                    <div className="chart-segment" style={{ background: '#646cff' }}>
                      <span>VebTask: 24.5h</span>
                    </div>
                    <div className="chart-segment" style={{ background: '#535bf2' }}>
                      <span>Client: 12h</span>
                    </div>
                    <div className="chart-segment" style={{ background: '#747bff' }}>
                      <span>Docs: 4h</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="report-card">
                <h3>Weekly Summary</h3>
                <div className="summary-stats">
                  <div className="summary-item">
                    <span className="summary-label">Total Hours:</span>
                    <span className="summary-value">{stats.weeklyHours}h</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Tasks Completed:</span>
                    <span className="summary-value">{stats.completedTasks}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Avg per Day:</span>
                    <span className="summary-value">{(stats.weeklyHours / 7).toFixed(1)}h</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Projects Active:</span>
                    <span className="summary-value">{stats.totalProjects}</span>
                  </div>
                </div>
              </div>
              <div className="report-card full-width">
                <h3>Productivity Trends</h3>
                <div className="trend-chart">
                  <div className="chart-bar" style={{ height: '60%' }}>Mon</div>
                  <div className="chart-bar" style={{ height: '80%' }}>Tue</div>
                  <div className="chart-bar" style={{ height: '45%' }}>Wed</div>
                  <div className="chart-bar" style={{ height: '90%' }}>Thu</div>
                  <div className="chart-bar" style={{ height: '75%' }}>Fri</div>
                  <div className="chart-bar" style={{ height: '30%' }}>Sat</div>
                  <div className="chart-bar" style={{ height: '20%' }}>Sun</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}