import { useState } from 'react';
import { useSession } from '../lib/auth-client';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  CheckSquare, 
  Plus,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  Search,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  estimatedHours: number;
  actualHours: number;
  dueDate?: string;
  assignee?: string;
  project?: string;
  isBillable: boolean;
  hourlyRate?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Mock tasks data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Quarterly Financial Report',
    description: 'Complete Q4 financial analysis and prepare executive summary for board meeting',
    priority: 'High',
    status: 'in_progress',
    estimatedHours: 8,
    actualHours: 3.5,
    dueDate: '2024-01-15',
    assignee: 'Current User',
    project: 'Finance Review',
    isBillable: true,
    hourlyRate: 95,
    tags: ['Finance', 'Reporting', 'Urgent'],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-12'
  },
  {
    id: '2',
    title: 'Client Presentation Prep',
    description: 'Design slides and prepare demo for tomorrow\'s client pitch meeting',
    priority: 'High',
    status: 'not_started',
    estimatedHours: 4,
    actualHours: 0,
    dueDate: '2024-01-14',
    assignee: 'Jane Smith',
    project: 'Sales Pipeline',
    isBillable: true,
    hourlyRate: 85,
    tags: ['Sales', 'Presentation', 'Client'],
    createdAt: '2024-01-11',
    updatedAt: '2024-01-11'
  },
  {
    id: '3',
    title: 'Code Review - Auth Module',
    description: 'Review pull request for new authentication system implementation',
    priority: 'Medium',
    status: 'in_progress',
    estimatedHours: 2,
    actualHours: 1,
    dueDate: '2024-01-16',
    project: 'Development',
    isBillable: false,
    tags: ['Development', 'Security', 'Review'],
    createdAt: '2024-01-09',
    updatedAt: '2024-01-12'
  },
  {
    id: '4',
    title: 'Team Meeting Notes',
    description: 'Document key decisions from weekly team sync and action items',
    priority: 'Low',
    status: 'completed',
    estimatedHours: 0.5,
    actualHours: 0.5,
    dueDate: '2024-01-12',
    project: 'Operations',
    isBillable: false,
    tags: ['Meeting', 'Documentation'],
    createdAt: '2024-01-12',
    updatedAt: '2024-01-12'
  },
  {
    id: '5',
    title: 'Website Performance Optimization',
    description: 'Analyze and improve website loading speeds and user experience metrics',
    priority: 'Medium',
    status: 'on_hold',
    estimatedHours: 6,
    actualHours: 2,
    dueDate: '2024-01-20',
    project: 'Web Development',
    isBillable: true,
    hourlyRate: 75,
    tags: ['Performance', 'Optimization', 'Web'],
    createdAt: '2024-01-08',
    updatedAt: '2024-01-10'
  }
];

export function Tasks() {
  const { data: session } = useSession();
  console.log('Current session:', session);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  console.log('New task form visible:', showNewTaskForm);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-error bg-error/10 border-error/20';
      case 'High': return 'text-error bg-error/10 border-error/20';
      case 'Medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'Low': return 'text-info bg-info/10 border-info/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10 border-success/20';
      case 'in_progress': return 'text-primary bg-primary/10 border-primary/20';
      case 'on_hold': return 'text-warning bg-warning/10 border-warning/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'on_hold': return <AlertCircle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const handleStatusUpdate = (taskId: string, newStatus: Task['status']) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
          : task
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Task Management</h1>
          <p className="text-muted-foreground mt-2">Organize, prioritize, and track your work</p>
        </div>
        <Button 
          onClick={() => setShowNewTaskForm(true)}
          className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow mr-4">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-success flex items-center justify-center shadow-glow mr-4">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskStats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-info flex items-center justify-center shadow-glow mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskStats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-error flex items-center justify-center shadow-glow mr-4">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskStats.overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass shadow-elevation">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card className="glass shadow-elevation">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tasks ({filteredTasks.length})</h2>
            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedTasks.size} selected
                </span>
                <Button size="sm" variant="outline" className="glass-surface">
                  Bulk Actions
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center p-4 border-b border-border last:border-b-0 hover:bg-surface-elevated/50 transition-colors",
                  selectedTasks.has(task.id) ? "bg-primary/5" : ""
                )}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                  className="mr-4 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
                        <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                          {task.priority}
                        </Badge>
                        <Badge className={cn("text-xs", getStatusColor(task.status))}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {task.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.actualHours}h / {task.estimatedHours}h
                        </span>
                        
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee}
                          </span>
                        )}
                        
                        {task.isBillable && task.hourlyRate && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${task.hourlyRate}/hr
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {task.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-muted/20 text-muted-foreground text-xs rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="ml-4 w-20">
                      <div className="w-full h-2 bg-surface-elevated rounded-full">
                        <div 
                          className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        {Math.round((task.actualHours / task.estimatedHours) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusUpdate(task.id, e.target.value as Task['status'])}
                    className="px-2 py-1 text-xs glass-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                  
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-error hover:text-error"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                    ? 'Try adjusting your filters or search term'
                    : 'Create your first task to get started'
                  }
                </p>
                <Button onClick={() => setShowNewTaskForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}