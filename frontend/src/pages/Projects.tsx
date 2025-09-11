import { useState, useEffect } from 'react';
import { useSession } from '../lib/auth-client';
import { useApiClient } from '../lib/api-client';
import { useOrganization } from '../contexts/OrganizationContext';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Building2,
  Plus,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ProjectModal } from '../components/ProjectModal';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  client?: {
    id: string;
    name: string;
    email: string;
  } | null;
  clientId?: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  spent: number;
  progress: number;
  estimatedHours: number;
  hoursLogged: number;
  color: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  // Frontend-only fields for display compatibility
  teamMembers?: string[];
  tasks?: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
  tags?: string[];
}

export function Projects() {
  const { data: session } = useSession();
  const { currentOrg } = useOrganization();
  const apiClient = useApiClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [, setSelectedProject] = useState<Project | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Fetch projects from server
  const fetchProjects = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.fetch(`/api/projects?userId=${session.user.id}&orgId=${currentOrg?.id || ''}&limit=100`);
      
      if (data.success) {
        // Use real API data - fallback to empty array if no projects
        setProjects(data.projects || []);
        console.log('📊 Loaded projects from database:', data.projects?.length || 0);
      } else {
        console.warn('Failed to fetch projects:', data.error);
        setError(data.error || 'Failed to fetch projects');
        setProjects([]);
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects on component mount and when session changes
  useEffect(() => {
    fetchProjects();
  }, [session?.user?.id, currentOrg?.id]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProjects = projects.filter(project => {
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || project.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success bg-success/10 border-success/20';
      case 'completed': return 'text-info bg-info/10 border-info/20';
      case 'on_hold': return 'text-warning bg-warning/10 border-warning/20';
      case 'planning': return 'text-primary bg-primary/10 border-primary/20';
      case 'cancelled': return 'text-error bg-error/10 border-error/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };


  const handleCreateProject = async (projectData: any) => {
    if (!session?.user?.id || !currentOrg?.id) {
      console.error('Missing required data:', { userId: session?.user?.id, orgId: currentOrg?.id });
      return;
    }

    try {
      console.log('🚀 Creating project:', projectData);
      
      const payload = {
        orgId: currentOrg.id,
        name: projectData.name,
        description: projectData.description || '',
        priority: projectData.priority || 'medium',
        status: projectData.status || 'planning',
        budget: projectData.budget ? parseFloat(projectData.budget) : null,
        estimatedHours: projectData.estimatedHours ? parseInt(projectData.estimatedHours) : null,
        startDate: projectData.startDate || null,
        endDate: projectData.deadline || null,
        color: projectData.color || 'bg-primary'
      };

      const data = await apiClient.fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📊 API Response:', data);

      if (data.success) {
        console.log('✅ Project created successfully:', data.project);
        // Refresh the entire projects list from server
        await fetchProjects();
        setShowNewProjectModal(false);
      } else {
        console.error('❌ Failed to create project:', data.error);
        throw new Error(data.error || 'Failed to create project');
      }
    } catch (error: any) {
      console.error('❌ Error creating project:', error);
    }
  };
  
  // Use the function to prevent unused warning

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'on_hold': return <AlertCircle className="h-4 w-4" />;
      case 'planning': return <Target className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalBudget: projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
    totalSpent: projects.reduce((sum, p) => sum + p.spent, 0),
    totalHours: projects.reduce((sum, p) => sum + p.hoursLogged, 0)
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Projects</h1>
          <p className="text-muted-foreground mt-2">Manage and track your project portfolio</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-surface-elevated rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-3 py-1 rounded text-sm font-medium transition-colors",
                viewMode === 'grid' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-1 rounded text-sm font-medium transition-colors",
                viewMode === 'list' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              List
            </button>
          </div>
          <Button 
            onClick={() => setShowNewProjectModal(true)}
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow mr-4">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projectStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-success flex items-center justify-center shadow-glow mr-4">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projectStats.active}</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-info flex items-center justify-center shadow-glow mr-4">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(projectStats.totalBudget / 1000).toFixed(0)}k</p>
                <p className="text-sm text-muted-foreground">Total Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-warning flex items-center justify-center shadow-glow mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projectStats.totalHours}</p>
                <p className="text-sm text-muted-foreground">Hours Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass shadow-elevation">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

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

            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredProjects.length} of {projects.length} projects
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid/List */}
      <div className={cn(
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
      )}>
        {filteredProjects.map((project) => (
          <Card 
            key={project.id} 
            className={cn(
              "glass shadow-elevation cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
              viewMode === 'list' && "w-full"
            )}
            onClick={() => setSelectedProject(project)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-glow", project.color)}>
                    {getStatusIcon(project.status)}
                    <span className="sr-only">{project.status}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">Client: {project.client?.name || 'No client assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={cn("text-xs", getStatusColor(project.status))}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1 capitalize">{project.status.replace('_', ' ')}</span>
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
              
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-surface-elevated rounded-full">
                  <div 
                    className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 glass-surface rounded-lg">
                  <p className="text-lg font-bold">{project.tasks?.completed || 0}/{project.tasks?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div className="text-center p-2 glass-surface rounded-lg">
                  <p className="text-lg font-bold">{project.hoursLogged}h</p>
                  <p className="text-xs text-muted-foreground">Logged</p>
                </div>
              </div>

              {/* Budget Info */}
              {(project.budget && project.budget > 0) && (
                <div className="flex items-center justify-between p-2 glass-surface rounded-lg">
                  <div>
                    <p className="text-sm font-medium">${(project.spent || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">of ${project.budget.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{Math.round(((project.spent || 0) / project.budget) * 100)}%</p>
                    <p className="text-xs text-muted-foreground">spent</p>
                  </div>
                </div>
              )}

              {/* Team Members */}
              {project.teamMembers && project.teamMembers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex -space-x-2">
                    {project.teamMembers.slice(0, 3).map((member, index) => (
                      <div
                        key={index}
                        className="h-6 w-6 rounded-full bg-gradient-primary border-2 border-background flex items-center justify-center"
                        title={member}
                      >
                        <span className="text-xs font-medium text-white">
                          {member.split('@')[0].charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {project.teamMembers.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">+{project.teamMembers.length - 3}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {project.teamMembers.length} member{project.teamMembers.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-muted/20 text-muted-foreground text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="px-2 py-1 bg-muted/20 text-muted-foreground text-xs rounded">
                      +{project.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>Due: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="glass shadow-elevation">
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              {filterStatus !== 'all' || filterPriority !== 'all' 
                ? 'Try adjusting your filters'
                : 'Create your first project to get started'
              }
            </p>
            <Button onClick={() => setShowNewProjectModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Project Modal */}
      <ProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSave={handleCreateProject}
      />
    </div>
  );
}