import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  CheckCircle2, 
  Clock, 
  Calendar,
  TrendingUp,
  Eye,
  FileText,
  Users,
  BarChart3
} from 'lucide-react';

interface TaskSummary {
  id: string;
  title: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  actualHours: number;
  completedAt?: string;
  assignee?: {
    name?: string;
    email: string;
  };
}

interface ProjectOverview {
  id: string;
  name: string;
  description?: string;
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  progress: number;
  status: 'active' | 'completed' | 'on_hold';
  dueDate?: string;
}

interface TimeEntry {
  id: string;
  taskTitle: string;
  date: string;
  duration: number;
  description?: string;
  assignee: string;
  isBillable: boolean;
}

// Mock data - replace with actual API calls
const mockTasks: TaskSummary[] = [
  {
    id: '1',
    title: 'Website Header Design',
    description: 'Design and implement the main header component',
    status: 'completed',
    priority: 'High',
    estimatedHours: 8,
    actualHours: 6.5,
    completedAt: '2024-01-15T10:30:00Z',
    assignee: { name: 'Sarah Wilson', email: 'sarah@company.com' }
  },
  {
    id: '2',
    title: 'User Authentication System',
    description: 'Implement login and registration functionality',
    status: 'in_progress',
    priority: 'High',
    estimatedHours: 16,
    actualHours: 12,
    assignee: { name: 'Mike Johnson', email: 'mike@company.com' }
  },
  {
    id: '3',
    title: 'Database Optimization',
    description: 'Optimize database queries for better performance',
    status: 'not_started',
    priority: 'Medium',
    estimatedHours: 12,
    actualHours: 0,
    assignee: { name: 'John Smith', email: 'john@company.com' }
  }
];

const mockProjects: ProjectOverview[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website',
    totalTasks: 15,
    completedTasks: 8,
    totalHours: 120,
    progress: 53,
    status: 'active',
    dueDate: '2024-02-15'
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android',
    totalTasks: 25,
    completedTasks: 3,
    totalHours: 200,
    progress: 12,
    status: 'active',
    dueDate: '2024-03-30'
  }
];

const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    taskTitle: 'Website Header Design',
    date: '2024-01-15',
    duration: 6.5,
    description: 'Completed header design and responsive layout',
    assignee: 'Sarah Wilson',
    isBillable: true
  },
  {
    id: '2',
    taskTitle: 'User Authentication System',
    date: '2024-01-14',
    duration: 4,
    description: 'Implemented login form validation',
    assignee: 'Mike Johnson',
    isBillable: true
  },
  {
    id: '3',
    taskTitle: 'User Authentication System',
    date: '2024-01-13',
    duration: 3.5,
    description: 'Set up authentication middleware',
    assignee: 'Mike Johnson',
    isBillable: true
  }
];

export function ClientDashboard() {
  const [tasks] = useState<TaskSummary[]>(mockTasks);
  const [projects] = useState<ProjectOverview[]>(mockProjects);
  const [timeEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tasks' | 'time'>('overview');

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'not_started': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  const totalHoursLogged = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Project Dashboard</h1>
          <p className="text-muted-foreground mt-2">Track the progress of your projects and tasks</p>
        </div>
        <div className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Read-only view</span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-foreground mt-2">{totalTasks}</p>
                <p className="text-xs text-muted-foreground mt-1">Across all projects</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground mt-2">{completedTasks}</p>
                <p className="text-xs text-success mt-1">
                  {Math.round((completedTasks / totalTasks) * 100)}% completion rate
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-success flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-foreground mt-2">{inProgressTasks}</p>
                <p className="text-xs text-warning mt-1">Currently active</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-warning flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hours Logged</p>
                <p className="text-2xl font-bold text-foreground mt-2">{totalHoursLogged}h</p>
                <p className="text-xs text-info mt-1">This period</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-info flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedTab === 'overview' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedTab('tasks')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedTab === 'tasks' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setSelectedTab('time')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedTab === 'time' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Time Logs
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Overview */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Project Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projects.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </div>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>{project.completedTasks} / {project.totalTasks} tasks</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    {project.dueDate && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-4 w-4" />
                        Due: {new Date(project.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Activity */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{entry.taskTitle}</p>
                      <p className="text-xs text-muted-foreground">{entry.assignee}</p>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{entry.duration}h</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'tasks' && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg bg-surface-elevated/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>
                          {task.priority}
                        </Badge>
                        {task.assignee && (
                          <span className="text-sm text-muted-foreground">
                            Assigned to: {task.assignee.name || task.assignee.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Hours: </span>
                        <span className="font-medium">
                          {task.actualHours} / {task.estimatedHours}
                        </span>
                      </p>
                      {task.completedAt && (
                        <p className="text-xs text-success">
                          Completed {new Date(task.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'time' && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg bg-surface-elevated/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{entry.taskTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        {entry.assignee} • {new Date(entry.date).toLocaleDateString()}
                      </p>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{entry.duration}h</p>
                      {entry.isBillable && (
                        <Badge variant="outline" className="text-xs">
                          Billable
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}