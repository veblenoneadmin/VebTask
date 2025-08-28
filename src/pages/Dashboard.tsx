import React, { useState } from 'react';
import { useSession, signOut } from '../lib/auth-client';
import { Navigate } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { TaskModal } from '../components/TaskModal';
import { ProjectModal } from '../components/ProjectModal';
import { Timer } from '../components/Timer';
import { AIProxyService as AIService, type ProcessedBrainDump } from '../lib/ai-proxy';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderOpen, 
  BarChart3, 
  LogOut,
  Plus,
  User,
  Clock,
  Target,
  TrendingUp,
  Activity,
  Calendar,
  Edit,
  Trash2,
  Pause,
  Brain,
  Save,
  Users,
  Building2,
  FileText,
  DollarSign,
  Settings,
  Shield,
  X,
  Mic,
  MicOff,
  Menu
} from 'lucide-react';

export function Dashboard() {
  const { data: session, isPending } = useSession();
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Mock user role - in real app this would come from session/database
  const userRole = 'admin'; // admin, manager, employee, client
  
  // Mock client data - in real app this would come from API
  const [clients] = useState([
    {
      id: '1',
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      company: 'Acme Corp',
      contactPerson: 'John Smith',
      status: 'active',
      projects: 3,
      totalBilled: 25000,
      lastActivity: new Date('2024-01-15')
    },
    {
      id: '2', 
      name: 'Tech Innovations LLC',
      email: 'hello@techinnovations.com',
      company: 'Tech Innovations',
      contactPerson: 'Sarah Johnson',
      status: 'active',
      projects: 1,
      totalBilled: 12000,
      lastActivity: new Date('2024-01-10')
    }
  ]);
  
  // Mock invoice data
  const [invoices] = useState([
    {
      id: '1',
      invoiceNumber: 'INV-001',
      clientName: 'Acme Corporation',
      amount: 5000,
      status: 'paid',
      dueDate: new Date('2024-01-20'),
      issueDate: new Date('2024-01-05')
    },
    {
      id: '2',
      invoiceNumber: 'INV-002', 
      clientName: 'Tech Innovations LLC',
      amount: 3500,
      status: 'pending',
      dueDate: new Date('2024-02-01'),
      issueDate: new Date('2024-01-15')
    }
  ]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(undefined);
  const [selectedProject, setSelectedProject] = useState(undefined);
  const [taskFilter, setTaskFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [brainDumpText, setBrainDumpText] = useState('');
  const [brainDumpEntries, setBrainDumpEntries] = useState(() => {
    const saved = localStorage.getItem('brainDumpEntries');
    return saved ? JSON.parse(saved) : [];
  });
  const [aiProcessing, setAiProcessing] = useState(false);
  const [lastProcessedDump, setLastProcessedDump] = useState<ProcessedBrainDump | null>(null);
  
  // Speech recognition hook
  const {
    isListening,
    isSupported: speechSupported,
    transcript,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: 'en-US'
  });

  // Handle speech recognition transcript updates
  React.useEffect(() => {
    if (transcript) {
      setBrainDumpText(prev => {
        const newText = prev + transcript;
        resetTranscript();
        return newText;
      });
    }
  }, [transcript, resetTranscript]);

  // Handle voice recording toggle
  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      if (speechSupported) {
        startListening();
      } else {
        alert('Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.');
      }
    }
  };

  // Handle mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      case 'completed': return <CheckSquare size={16} className="status-icon completed" />;
      case 'in-progress': return <Activity size={16} className="status-icon in-progress" />;
      default: return <Pause size={16} className="status-icon pending" />;
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

  const handleAIProcessing = async () => {
    if (!brainDumpText.trim()) return;
    
    setAiProcessing(true);
    try {
      const processed = await AIService.processBrainDump(brainDumpText);
      setLastProcessedDump(processed);
      
      // Save the brain dump entry with AI processing results
      const newEntry = {
        id: Date.now().toString(),
        content: brainDumpText,
        timestamp: new Date(),
        aiProcessed: true,
        processedData: processed
      };
      
      const updatedEntries = [newEntry, ...brainDumpEntries];
      setBrainDumpEntries(updatedEntries);
      localStorage.setItem('brainDumpEntries', JSON.stringify(updatedEntries));
      setBrainDumpText('');
    } catch (error) {
      console.error('AI processing failed:', error);
      // Fallback to regular save
      const newEntry = {
        id: Date.now().toString(),
        content: brainDumpText,
        timestamp: new Date(),
        aiProcessed: false,
        error: 'AI processing failed'
      };
      
      const updatedEntries = [newEntry, ...brainDumpEntries];
      setBrainDumpEntries(updatedEntries);
      localStorage.setItem('brainDumpEntries', JSON.stringify(updatedEntries));
      setBrainDumpText('');
    } finally {
      setAiProcessing(false);
    }
  };

  const createTasksFromAI = (extractedTasks: any[]) => {
    extractedTasks.forEach((aiTask, index) => {
      setTimeout(() => {
        addTask({
          title: aiTask.title,
          description: aiTask.description,
          priority: aiTask.priority,
          status: 'todo',
          tags: aiTask.tags,
          projectId: undefined,
          estimatedTime: Math.round(aiTask.estimatedHours * 60), // Convert to minutes
          dueDate: undefined
        });
      }, index * 100);
    });
  };

  return (
    <div className="dashboard">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button 
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={20} />
        </button>
      )}
      
      <header className="dashboard-header">
        <div className="header-left">
          <div className="dashboard-brand">
            <div className="dashboard-icon">V</div>
            <h1>VebTask</h1>
          </div>
          <nav className={`nav-tabs main-nav ${sidebarOpen ? 'mobile-nav-open' : ''}`}>
            <button 
              className={activeView === 'overview' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => {
                setActiveView('overview');
                setSidebarOpen(false);
              }}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>
            <button 
              className={activeView === 'tasks' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => {
                setActiveView('tasks');
                setSidebarOpen(false);
              }}
            >
              <CheckSquare size={18} />
              Tasks
            </button>
            <button 
              className={activeView === 'projects' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => {
                setActiveView('projects');
                setSidebarOpen(false);
              }}
            >
              <FolderOpen size={18} />
              Projects
            </button>
            <button 
              className={activeView === 'reports' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => {
                setActiveView('reports');
                setSidebarOpen(false);
              }}
            >
              <BarChart3 size={18} />
              Reports
            </button>
            <button 
              className={activeView === 'brain-dump' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => {
                setActiveView('brain-dump');
                setSidebarOpen(false);
              }}
            >
              <Brain size={18} />
              Brain Dump
            </button>
            <button 
              className={activeView === 'calendar' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => {
                setActiveView('calendar');
                setSidebarOpen(false);
              }}
            >
              <Calendar size={18} />
              Calendar
            </button>
            {(userRole === 'admin' || userRole === 'manager') && (
              <>
                <button 
                  className={activeView === 'clients' ? 'nav-tab active' : 'nav-tab'}
                  onClick={() => {
                    setActiveView('clients');
                    setSidebarOpen(false);
                  }}
                >
                  <Users size={18} />
                  Clients
                </button>
                <button 
                  className={activeView === 'invoices' ? 'nav-tab active' : 'nav-tab'}
                  onClick={() => {
                    setActiveView('invoices');
                    setSidebarOpen(false);
                  }}
                >
                  <FileText size={18} />
                  Invoices
                </button>
              </>
            )}
            {userRole === 'admin' && (
              <button 
                className={activeView === 'admin' ? 'nav-tab active' : 'nav-tab'}
                onClick={() => {
                  setActiveView('admin');
                  setSidebarOpen(false);
                }}
              >
                <Shield size={18} />
                Admin
              </button>
            )}
          </nav>
        </div>
        <div className="user-info">
          <div className="user-profile">
            <User size={16} />
            <span>Welcome, {session.user.name || session.user.email}!</span>
          </div>
          <button onClick={handleSignOut} className="signout-btn">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {activeView === 'overview' && (
          <div className="overview-view">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Target size={24} />
                </div>
                <div className="stat-info">
                  <h3>{stats.total}</h3>
                  <p>Total Tasks</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <CheckSquare size={24} />
                </div>
                <div className="stat-info">
                  <h3>{stats.completed}</h3>
                  <p>Completed</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-info">
                  <h3>{stats.inProgress}</h3>
                  <p>In Progress</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
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
                            <Edit size={14} />
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="primary-btn" onClick={() => setTaskModalOpen(true)}>
                  <Plus size={16} />
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
                  <Plus size={16} />
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
                <Plus size={16} />
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
                        <Edit size={14} />
                        Edit
                      </button>
                      <button 
                        className="action-btn danger" 
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 size={14} />
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
                    <Plus size={16} />
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
                <Plus size={16} />
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
                    <Plus size={16} />
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

        {activeView === 'brain-dump' && (
          <div className="brain-dump-view">
            <div className="view-header">
              <h2>Brain Dump</h2>
              <p>Capture your thoughts and ideas instantly</p>
            </div>
            <div className="brain-dump-container">
              <div className="brain-dump-input">
                <div className="textarea-container">
                  <textarea
                    value={brainDumpText + (interimTranscript ? ` ${interimTranscript}` : '')}
                    onChange={(e) => setBrainDumpText(e.target.value)}
                    placeholder="What's on your mind? Capture your thoughts, ideas, tasks, or anything that comes to mind... Our AI will help organize and prioritize your thoughts! Click the microphone to speak."
                    className={`brain-dump-textarea ${isListening ? 'listening' : ''}`}
                  />
                  <button
                    className={`voice-btn ${isListening ? 'listening' : ''} ${!speechSupported ? 'disabled' : ''}`}
                    onClick={handleVoiceToggle}
                    disabled={!speechSupported}
                    title={isListening ? 'Stop recording' : 'Start voice recording'}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                </div>
                {speechError && (
                  <div className="speech-error">
                    {speechError}
                  </div>
                )}
                {isListening && (
                  <div className="speech-status">
                    🎤 Listening... Speak clearly and I'll transcribe your thoughts.
                  </div>
                )}
                <div className="brain-dump-actions">
                  <button 
                    className="primary-btn ai-btn"
                    onClick={handleAIProcessing}
                    disabled={!brainDumpText.trim() || aiProcessing}
                  >
                    {aiProcessing ? (
                      <>
                        <div className="ai-processing-spinner" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Brain size={16} />
                        AI Process
                      </>
                    )}
                  </button>
                  <button 
                    className="secondary-btn"
                    onClick={() => {
                      if (brainDumpText.trim()) {
                        const newEntry = {
                          id: Date.now().toString(),
                          content: brainDumpText,
                          timestamp: new Date(),
                          aiProcessed: false
                        };
                        const updatedEntries = [newEntry, ...brainDumpEntries];
                        setBrainDumpEntries(updatedEntries);
                        localStorage.setItem('brainDumpEntries', JSON.stringify(updatedEntries));
                        setBrainDumpText('');
                      }
                    }}
                    disabled={!brainDumpText.trim() || aiProcessing}
                  >
                    <Save size={16} />
                    Quick Save
                  </button>
                  <button 
                    className="secondary-btn"
                    onClick={() => {
                      const lines = brainDumpText.split('\n').filter(line => line.trim());
                      lines.forEach((line, index) => {
                        if (line.trim()) {
                          setTimeout(() => {
                            addTask({
                              title: line.trim(),
                              description: '',
                              priority: 'medium',
                              status: 'todo',
                              tags: ['brain-dump'],
                              projectId: undefined,
                              estimatedTime: undefined,
                              dueDate: undefined
                            });
                          }, index * 100);
                        }
                      });
                      setBrainDumpText('');
                    }}
                    disabled={!brainDumpText.trim() || aiProcessing}
                  >
                    <Plus size={16} />
                    Manual Tasks
                  </button>
                </div>
                
                {/* AI Processing Results */}
                {lastProcessedDump && (
                  <div className="ai-results">
                    <div className="ai-results-header">
                      <Brain size={18} />
                      <h4>AI Analysis Results</h4>
                    </div>
                    <div className="ai-summary">
                      <p>{lastProcessedDump.summary}</p>
                    </div>
                    <div className="ai-tasks">
                      <h5>Extracted Tasks ({lastProcessedDump.extractedTasks.length})</h5>
                      <div className="ai-task-list">
                        {lastProcessedDump.extractedTasks.map(task => (
                          <div key={task.id} className="ai-task-item">
                            <div className="ai-task-header">
                              <h6>{task.title}</h6>
                              <div className="ai-task-meta">
                                <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                                <span className="time-estimate">{task.estimatedHours}h</span>
                                <span className="category-badge">{task.category}</span>
                              </div>
                            </div>
                            <p className="ai-task-description">{task.description}</p>
                            {task.tags.length > 0 && (
                              <div className="ai-task-tags">
                                {task.tags.map(tag => (
                                  <span key={tag} className="ai-tag">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <button 
                        className="primary-btn"
                        onClick={() => {
                          createTasksFromAI(lastProcessedDump.extractedTasks);
                          setLastProcessedDump(null);
                        }}
                      >
                        <Plus size={16} />
                        Create All Tasks
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="brain-dump-entries">
                <h3>Recent Entries</h3>
                <div className="entries-list">
                  {brainDumpEntries.map((entry: any) => (
                    <div key={entry.id} className={`brain-dump-entry ${entry.aiProcessed ? 'ai-processed' : ''}`}>
                      <div className="entry-header">
                        {entry.aiProcessed && (
                          <div className="ai-badge">
                            <Brain size={12} />
                            AI Processed
                          </div>
                        )}
                        {entry.error && (
                          <div className="error-badge">
                            <X size={12} />
                            Processing Failed
                          </div>
                        )}
                      </div>
                      <div className="entry-content">
                        {entry.content.split('\n').map((line: string, index: number) => (
                          <p key={index}>{line}</p>
                        ))}
                      </div>
                      {entry.processedData && (
                        <div className="entry-ai-summary">
                          <p><strong>AI Summary:</strong> {entry.processedData.summary}</p>
                          <div className="ai-extracted-count">
                            {entry.processedData.extractedTasks.length} tasks extracted
                          </div>
                        </div>
                      )}
                      <div className="entry-meta">
                        <span className="entry-timestamp">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <div className="entry-actions">
                          {entry.processedData ? (
                            <button 
                              className="action-btn ai-action"
                              onClick={() => {
                                createTasksFromAI(entry.processedData.extractedTasks);
                              }}
                            >
                              <Brain size={12} />
                              Create AI Tasks
                            </button>
                          ) : (
                            <button 
                              className="action-btn"
                              onClick={() => {
                                addTask({
                                  title: entry.content.split('\n')[0].substring(0, 50),
                                  description: entry.content,
                                  priority: 'medium',
                                  status: 'todo',
                                  tags: ['brain-dump'],
                                  projectId: undefined,
                                  estimatedTime: undefined,
                                  dueDate: undefined
                                });
                              }}
                            >
                              <Plus size={12} />
                              Make Task
                            </button>
                          )}
                          <button 
                            className="action-btn danger"
                            onClick={() => {
                              const updatedEntries = brainDumpEntries.filter((e: any) => e.id !== entry.id);
                              setBrainDumpEntries(updatedEntries);
                              localStorage.setItem('brainDumpEntries', JSON.stringify(updatedEntries));
                            }}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {brainDumpEntries.length === 0 && (
                    <div className="empty-state">
                      <Brain size={48} />
                      <p>No brain dump entries yet. Start capturing your thoughts above!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="calendar-view">
            <div className="view-header">
              <h2>Calendar Integration</h2>
              <p>Manage your tasks with calendar view</p>
            </div>
            <div className="calendar-container">
              <div className="calendar-controls">
                <button className="secondary-btn">
                  <Calendar size={16} />
                  Today
                </button>
                <div className="date-navigation">
                  <button className="nav-btn">‹</button>
                  <span className="current-month">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button className="nav-btn">›</button>
                </div>
                <select className="filter-select">
                  <option>All Tasks</option>
                  <option>Due Today</option>
                  <option>This Week</option>
                  <option>Overdue</option>
                </select>
              </div>
              
              <div className="calendar-grid">
                {/* Simple calendar implementation */}
                <div className="calendar-header">
                  <div className="day-header">Sun</div>
                  <div className="day-header">Mon</div>
                  <div className="day-header">Tue</div>
                  <div className="day-header">Wed</div>
                  <div className="day-header">Thu</div>
                  <div className="day-header">Fri</div>
                  <div className="day-header">Sat</div>
                </div>
                <div className="calendar-days">
                  {Array.from({ length: 35 }, (_, index) => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    const startDate = new Date(firstDay);
                    startDate.setDate(startDate.getDate() - firstDay.getDay());
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + index);
                    
                    const tasksForDay = tasks.filter(task => 
                      task.dueDate && 
                      task.dueDate.toDateString() === currentDate.toDateString()
                    );
                    
                    const isToday = currentDate.toDateString() === today.toDateString();
                    const isCurrentMonth = currentDate.getMonth() === today.getMonth();
                    
                    return (
                      <div 
                        key={index} 
                        className={`calendar-day ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                      >
                        <div className="day-number">{currentDate.getDate()}</div>
                        <div className="day-tasks">
                          {tasksForDay.slice(0, 3).map(task => (
                            <div 
                              key={task.id} 
                              className={`task-dot ${task.priority}`}
                              title={task.title}
                            />
                          ))}
                          {tasksForDay.length > 3 && (
                            <div className="task-overflow">+{tasksForDay.length - 3}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="calendar-sidebar">
                <h3>Upcoming Tasks</h3>
                <div className="upcoming-tasks">
                  {tasks
                    .filter(task => task.dueDate && task.dueDate >= new Date())
                    .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))
                    .slice(0, 10)
                    .map(task => {
                      const project = projects.find(p => p.id === task.projectId);
                      const daysUntilDue = Math.ceil(((task.dueDate?.getTime() || 0) - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={task.id} className="upcoming-task">
                          <div className="task-info">
                            <h4>{task.title}</h4>
                            <p>{project?.name || 'No Project'}</p>
                            <span className={`due-indicator ${daysUntilDue <= 1 ? 'urgent' : daysUntilDue <= 7 ? 'soon' : ''}`}>
                              {daysUntilDue === 0 ? 'Due Today' : 
                               daysUntilDue === 1 ? 'Due Tomorrow' : 
                               `Due in ${daysUntilDue} days`}
                            </span>
                          </div>
                          <div className="task-actions">
                            <button className="action-btn" onClick={() => handleEditTask(task)}>
                              <Edit size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {tasks.filter(task => task.dueDate && task.dueDate >= new Date()).length === 0 && (
                    <div className="empty-state">
                      <Calendar size={48} />
                      <p>No upcoming tasks with due dates. Add some deadlines to see them here!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'clients' && (userRole === 'admin' || userRole === 'manager') && (
          <div className="clients-view">
            <div className="view-header">
              <h2>Client Management</h2>
              <button className="primary-btn">
                <Plus size={16} />
                Add Client
              </button>
            </div>
            
            <div className="clients-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <h3>{clients.length}</h3>
                  <p>Active Clients</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <DollarSign size={24} />
                </div>
                <div className="stat-info">
                  <h3>${clients.reduce((sum, c) => sum + c.totalBilled, 0).toLocaleString()}</h3>
                  <p>Total Revenue</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Building2 size={24} />
                </div>
                <div className="stat-info">
                  <h3>{clients.reduce((sum, c) => sum + c.projects, 0)}</h3>
                  <p>Active Projects</p>
                </div>
              </div>
            </div>

            <div className="clients-table">
              <div className="table-header">
                <div className="table-cell">Client</div>
                <div className="table-cell">Contact</div>
                <div className="table-cell">Projects</div>
                <div className="table-cell">Revenue</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Actions</div>
              </div>
              {clients.map(client => (
                <div key={client.id} className="table-row">
                  <div className="table-cell">
                    <div className="client-info">
                      <div className="client-avatar">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4>{client.name}</h4>
                        <p>{client.company}</p>
                      </div>
                    </div>
                  </div>
                  <div className="table-cell">
                    <div>
                      <p>{client.contactPerson}</p>
                      <span className="email">{client.email}</span>
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className="project-count">{client.projects} active</span>
                  </div>
                  <div className="table-cell">
                    <span className="revenue">${client.totalBilled.toLocaleString()}</span>
                  </div>
                  <div className="table-cell">
                    <span className={`status-badge ${client.status}`}>
                      {client.status}
                    </span>
                  </div>
                  <div className="table-cell">
                    <div className="action-buttons">
                      <button className="action-btn">
                        <Edit size={14} />
                      </button>
                      <button className="action-btn">
                        <FileText size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'invoices' && (userRole === 'admin' || userRole === 'manager') && (
          <div className="invoices-view">
            <div className="view-header">
              <h2>Invoice Management</h2>
              <button className="primary-btn">
                <Plus size={16} />
                Create Invoice
              </button>
            </div>

            <div className="invoices-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <FileText size={24} />
                </div>
                <div className="stat-info">
                  <h3>{invoices.length}</h3>
                  <p>Total Invoices</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <DollarSign size={24} />
                </div>
                <div className="stat-info">
                  <h3>${invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</h3>
                  <p>Total Amount</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon pending">
                  <Clock size={24} />
                </div>
                <div className="stat-info">
                  <h3>{invoices.filter(inv => inv.status === 'pending').length}</h3>
                  <p>Pending Payment</p>
                </div>
              </div>
            </div>

            <div className="invoices-table">
              <div className="table-header">
                <div className="table-cell">Invoice #</div>
                <div className="table-cell">Client</div>
                <div className="table-cell">Amount</div>
                <div className="table-cell">Due Date</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Actions</div>
              </div>
              {invoices.map(invoice => (
                <div key={invoice.id} className="table-row">
                  <div className="table-cell">
                    <span className="invoice-number">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="table-cell">
                    <span>{invoice.clientName}</span>
                  </div>
                  <div className="table-cell">
                    <span className="amount">${invoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="table-cell">
                    <span className={`due-date ${new Date() > invoice.dueDate ? 'overdue' : ''}`}>
                      {invoice.dueDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="table-cell">
                    <span className={`status-badge ${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="table-cell">
                    <div className="action-buttons">
                      <button className="action-btn">
                        <Edit size={14} />
                      </button>
                      <button className="action-btn">
                        <FileText size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'admin' && userRole === 'admin' && (
          <div className="admin-view">
            <div className="view-header">
              <h2>Administrative Dashboard</h2>
              <div className="admin-actions">
                <button className="secondary-btn">
                  <Settings size={16} />
                  System Settings
                </button>
                <button className="primary-btn">
                  <Users size={16} />
                  Manage Users
                </button>
              </div>
            </div>

            <div className="admin-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <h3>12</h3>
                  <p>Total Users</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Shield size={24} />
                </div>
                <div className="stat-info">
                  <h3>3</h3>
                  <p>Security Events</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Activity size={24} />
                </div>
                <div className="stat-info">
                  <h3>98%</h3>
                  <p>System Health</p>
                </div>
              </div>
            </div>

            <div className="admin-panels">
              <div className="admin-panel">
                <h3>Recent Security Events</h3>
                <div className="security-events">
                  <div className="security-event">
                    <div className="event-icon login-success">
                      <CheckSquare size={16} />
                    </div>
                    <div className="event-details">
                      <p>Successful login</p>
                      <span>tony@opusautomations.com • 2 minutes ago</span>
                    </div>
                  </div>
                  <div className="security-event">
                    <div className="event-icon login-failed">
                      <X size={16} />
                    </div>
                    <div className="event-details">
                      <p>Failed login attempt</p>
                      <span>unknown@email.com • 1 hour ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-panel">
                <h3>System Analytics</h3>
                <div className="analytics-grid">
                  <div className="analytics-item">
                    <span className="analytics-label">Active Sessions</span>
                    <span className="analytics-value">8</span>
                  </div>
                  <div className="analytics-item">
                    <span className="analytics-label">Database Size</span>
                    <span className="analytics-value">2.4 GB</span>
                  </div>
                  <div className="analytics-item">
                    <span className="analytics-label">API Requests</span>
                    <span className="analytics-value">1,247</span>
                  </div>
                  <div className="analytics-item">
                    <span className="analytics-label">Uptime</span>
                    <span className="analytics-value">99.9%</span>
                  </div>
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