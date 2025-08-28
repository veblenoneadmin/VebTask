import { useState } from 'react';
import { useSession, signOut } from '../lib/auth-client';
import { Navigate } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { TaskModal } from '../components/TaskModal';
import { ProjectModal } from '../components/ProjectModal';
import { Timer } from '../components/Timer';

export function Dashboard() {
  const { data: session, isPending } = useSession();
  const [activeView, setActiveView] = useState('overview');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(undefined);
  const [selectedProject, setSelectedProject] = useState(undefined);
  const [taskFilter, setTaskFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  const {
    tasks,
    projects,
    loading,
    addTask,
    updateTask,
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    startTimer,
    stopTimer,
    pauseTimer,
    isTimerRunning,
    getTimerDuration,
    getTaskStats,
    getProjectStats
  } = useTasks();

  if (isPending || loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const stats = getTaskStats();
  const projectStats = getProjectStats();

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    const statusMatch = taskFilter === 'all' || task.status === taskFilter || 
      (taskFilter === 'active' && task.status !== 'completed');
    const projectMatch = projectFilter === 'all' || task.projectId === projectFilter;
    return statusMatch && projectMatch;
  });

  const formatTime = (minutes: number) => {
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      default: return '⏸️';
    }
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setProjectModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? Tasks will be unassigned but not deleted.')) {
      deleteProject(projectId);
    }
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setSelectedTask(undefined);
  };

  const closeProjectModal = () => {
    setProjectModalOpen(false);
    setSelectedProject(undefined);
  };

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
                  <h3>{stats.total}</h3>
                  <p>Total Tasks</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{stats.completed}</h3>
                  <p>Completed</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚀</div>
                <div className="stat-info">
                  <h3>{stats.inProgress}</h3>
                  <p>In Progress</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏰</div>
                <div className="stat-info">
                  <h3>{formatTime(stats.totalTime)}</h3>
                  <p>Total Time</p>
                </div>
              </div>
            </div>

            <div className="content-grid">
              <div className="content-section">
                <h2>Recent Tasks</h2>
                <div className="task-list">
                  {tasks.slice(0, 4).map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <div key={task.id} className="task-item">
                        <div className="task-status">
                          <span 
                            className="priority-indicator" 
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          />
                          <span className="status-badge">
                            {getStatusIcon(task.status)}
                          </span>
                        </div>
                        <div className="task-details">
                          <h4>{task.title}</h4>
                          <p>{project?.name || 'No Project'} • {formatTime(task.actualTime)}</p>
                          {task.tags.length > 0 && (
                            <div className="task-tags">
                              {task.tags.map(tag => (
                                <span key={tag} className="tag">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="task-timer">
                          <Timer
                            taskId={task.id}
                            isRunning={isTimerRunning(task.id)}
                            onStart={() => startTimer(task.id)}
                            onStop={() => stopTimer(task.id)}
                            onPause={() => pauseTimer(task.id)}
                            getDuration={() => getTimerDuration(task.id)}
                          />
                        </div>
                        <div className="task-actions">
                          <button className="action-btn" onClick={() => handleEditTask(task)}>
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="primary-btn" onClick={() => setTaskModalOpen(true)}>
                  Add New Task
                </button>
              </div>

              <div className="content-section">
                <h2>Active Projects</h2>
                <div className="project-list">
                  {projectStats.filter(p => p.status === 'active').slice(0, 3).map(project => (
                    <div key={project.id} className="project-item">
                      <div className="project-header">
                        <div 
                          className="project-color" 
                          style={{ backgroundColor: project.color }}
                        />
                        <h4>{project.name}</h4>
                      </div>
                      <div className="project-stats">
                        <span>{project.completedTasks}/{project.taskCount} tasks</span>
                        <span>{formatTime(project.totalTime)} logged</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${project.completionRate * 100}%`,
                            backgroundColor: project.color
                          }}
                        />
                      </div>
                      <div className="progress-text">
                        {Math.round(project.completionRate * 100)}% Complete
                      </div>
                    </div>
                  ))}
                </div>
                <button className="primary-btn" onClick={() => setProjectModalOpen(true)}>
                  New Project
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'tasks' && (
          <div className="tasks-view">
            <div className="view-header">
              <h2>Task Management</h2>
              <button className="primary-btn" onClick={() => setTaskModalOpen(true)}>
                Add Task
              </button>
            </div>
            <div className="task-filters">
              <select 
                className="filter-select"
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
              >
                <option value="all">All Tasks</option>
                <option value="active">Active</option>
                <option value="in-progress">In Progress</option>
                <option value="todo">To Do</option>
                <option value="completed">Completed</option>
              </select>
              <select 
                className="filter-select"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div className="task-list detailed">
              {filteredTasks.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <div key={task.id} className="task-item detailed">
                    <div className="task-checkbox">
                      <input 
                        type="checkbox" 
                        checked={task.status === 'completed'}
                        onChange={() => updateTask(task.id, {
                          status: task.status === 'completed' ? 'todo' : 'completed'
                        })}
                      />
                    </div>
                    <div className="task-priority">
                      <div 
                        className="priority-dot"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                        title={`${task.priority} priority`}
                      />
                    </div>
                    <div className="task-content">
                      <h4>{task.title}</h4>
                      <p>{task.description}</p>
                      <div className="task-meta">
                        <span>{project?.name || 'No Project'}</span>
                        {task.dueDate && (
                          <span className="due-date">
                            Due: {task.dueDate.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {task.tags.length > 0 && (
                        <div className="task-tags">
                          {task.tags.map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="task-time-info">
                      <div className="time-stats">
                        <div>Actual: {formatTime(task.actualTime)}</div>
                        {task.estimatedTime && (
                          <div>Est: {formatTime(task.estimatedTime)}</div>
                        )}
                      </div>
                      <Timer
                        taskId={task.id}
                        isRunning={isTimerRunning(task.id)}
                        onStart={() => startTimer(task.id)}
                        onStop={() => stopTimer(task.id)}
                        onPause={() => pauseTimer(task.id)}
                        getDuration={() => getTimerDuration(task.id)}
                      />
                    </div>
                    <div className="task-actions">
                      <button className="action-btn" onClick={() => handleEditTask(task)}>
                        Edit
                      </button>
                      <button 
                        className="action-btn danger" 
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredTasks.length === 0 && (
                <div className="empty-state">
                  <p>No tasks found. Create your first task to get started!</p>
                  <button className="primary-btn" onClick={() => setTaskModalOpen(true)}>
                    Add Task
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'projects' && (
          <div className="projects-view">
            <div className="view-header">
              <h2>Project Management</h2>
              <button className="primary-btn" onClick={() => setProjectModalOpen(true)}>
                New Project
              </button>
            </div>
            <div className="projects-grid">
              {projectStats.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-card-header">
                    <div 
                      className="project-color-large" 
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="project-info">
                      <h3>{project.name}</h3>
                      <p>{project.description}</p>
                      <span className={`status-badge ${project.status}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="project-metrics">
                    <div className="metric">
                      <span className="metric-value">{project.taskCount}</span>
                      <span className="metric-label">Total Tasks</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{project.completedTasks}</span>
                      <span className="metric-label">Completed</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{formatTime(project.totalTime)}</span>
                      <span className="metric-label">Time Logged</span>
                    </div>
                  </div>
                  <div className="progress-section">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${project.completionRate * 100}%`,
                          backgroundColor: project.color
                        }}
                      />
                    </div>
                    <span className="progress-text">
                      {Math.round(project.completionRate * 100)}% Complete
                    </span>
                  </div>
                  <div className="project-actions">
                    <button 
                      className="secondary-btn"
                      onClick={() => {
                        setProjectFilter(project.id);
                        setActiveView('tasks');
                      }}
                    >
                      View Tasks
                    </button>
                    <button 
                      className="secondary-btn"
                      onClick={() => handleEditProject(project)}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-btn danger"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="empty-state">
                  <p>No projects yet. Create your first project to organize your tasks!</p>
                  <button className="primary-btn" onClick={() => setProjectModalOpen(true)}>
                    New Project
                  </button>
                </div>
              )}
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
                <h3>Time Distribution by Project</h3>
                <div className="chart-placeholder">
                  <div className="pie-chart">
                    {projectStats.map(project => (
                      <div 
                        key={project.id}
                        className="chart-segment" 
                        style={{ background: project.color }}
                      >
                        <span>{project.name}: {formatTime(project.totalTime)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="report-card">
                <h3>Summary</h3>
                <div className="summary-stats">
                  <div className="summary-item">
                    <span className="summary-label">Total Hours:</span>
                    <span className="summary-value">{formatTime(stats.totalTime)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Tasks Completed:</span>
                    <span className="summary-value">{stats.completed}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">In Progress:</span>
                    <span className="summary-value">{stats.inProgress}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Projects Active:</span>
                    <span className="summary-value">{projects.filter(p => p.status === 'active').length}</span>
                  </div>
                </div>
              </div>

              <div className="report-card">
                <h3>Task Priority Distribution</h3>
                <div className="priority-chart">
                  {['high', 'medium', 'low'].map(priority => {
                    const count = tasks.filter(t => t.priority === priority).length;
                    const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                    return (
                      <div key={priority} className="priority-item">
                        <div className="priority-info">
                          <span 
                            className="priority-dot" 
                            style={{ backgroundColor: getPriorityColor(priority) }}
                          />
                          <span className="priority-label">{priority}</span>
                        </div>
                        <div className="priority-bar">
                          <div 
                            className="priority-fill"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: getPriorityColor(priority)
                            }}
                          />
                        </div>
                        <span className="priority-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="report-card full-width">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {tasks
                    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                    .slice(0, 10)
                    .map(task => {
                      const project = projects.find(p => p.id === task.projectId);
                      return (
                        <div key={task.id} className="activity-item">
                          <div className="activity-icon">
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="activity-content">
                            <span className="activity-task">{task.title}</span>
                            <span className="activity-project">{project?.name || 'No Project'}</span>
                          </div>
                          <div className="activity-time">
                            {task.updatedAt.toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={closeTaskModal}
        onSave={addTask}
        onUpdate={updateTask}
        task={selectedTask}
        projects={projects}
      />
      
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={closeProjectModal}
        onSave={addProject}
        onUpdate={updateProject}
        project={selectedProject}
      />
    </div>
  );
}