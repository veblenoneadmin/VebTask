import { useState, useEffect } from 'react';
import { useSession } from '../lib/auth-client';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  FileText,
  Plus,
  Users,
  Target,
  Activity,
  X,
  Save,
  Building2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { createPortal } from 'react-dom';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  budget?: number;
  spent?: number;
  completion?: number;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  projectId?: string;
  hoursSpent?: number;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: any) => void;
}

function ReportModal({ isOpen, onClose, onSave }: ReportModalProps) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      fetchProjectsAndTasks();
    }
  }, [isOpen, session?.user?.id]);

  const fetchProjectsAndTasks = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks')
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProjectData = projects.find(p => p.id === selectedProject);
    const relatedTasks = tasks.filter(t => t.projectId === selectedProject);

    const reportData = {
      userName,
      project: selectedProjectData,
      tasks: relatedTasks,
      createdAt: new Date().toISOString()
    };

    onSave(reportData);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay glass"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-content glass shadow-elevation"
        style={{
          maxWidth: '700px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #333'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{
          background: 'linear-gradient(135deg, #646cff, #8b5cf6)',
          borderRadius: '8px 8px 0 0',
          padding: '24px',
          color: 'white'
        }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold m-0">Create New Report</h2>
              <p className="text-white/80 text-sm m-0 mt-1">
                Generate a report with project and task breakdown
              </p>
            </div>
          </div>
          <button
            className="modal-close bg-white/20 hover:bg-white/30 rounded-lg p-2"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ padding: '24px' }}>
          <div className="space-y-6">
            {/* User Name */}
            <div className="form-group">
              <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                <Users className="w-4 h-4" />
                Your Name *
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                placeholder="Enter your name"
                className="w-full p-3 bg-surface-elevated border border-border rounded-lg text-white placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Project Selection */}
            <div className="form-group">
              <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                <Building2 className="w-4 h-4" />
                Select Project *
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                required
                className="w-full p-3 bg-surface-elevated border border-border rounded-lg text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="" className="bg-surface-elevated">Choose a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id} className="bg-surface-elevated">
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Breakdown */}
            {selectedProject && (
              <div className="form-group">
                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Target className="w-4 h-4" />
                  Project Breakdown
                </label>
                {(() => {
                  const project = projects.find(p => p.id === selectedProject);
                  return project ? (
                    <div className="p-4 glass-surface rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white">{project.name}</h3>
                        <Badge className={cn(
                          "text-xs capitalize",
                          project.status === 'completed' ? 'bg-success/20 text-success' :
                          project.status === 'active' ? 'bg-info/20 text-info' :
                          project.status === 'planning' ? 'bg-warning/20 text-warning' :
                          'bg-muted/20 text-muted-foreground'
                        )}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {project.budget && (
                          <div>
                            <span className="text-muted-foreground">Budget: </span>
                            <span className="font-semibold text-white">${project.budget.toLocaleString()}</span>
                          </div>
                        )}
                        {project.completion !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Progress: </span>
                            <span className="font-semibold text-white">{project.completion}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Task Breakdown */}
            {selectedProject && (
              <div className="form-group">
                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Activity className="w-4 h-4" />
                  Task Breakdown
                </label>
                {(() => {
                  const relatedTasks = tasks.filter(t => t.projectId === selectedProject);
                  return (
                    <div className="space-y-3">
                      {relatedTasks.length > 0 ? (
                        relatedTasks.map((task) => (
                          <div key={task.id} className="p-3 glass-surface rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-white">{task.title}</h4>
                              <Badge className={cn(
                                "text-xs",
                                task.status === 'completed' ? 'bg-success/20 text-success' :
                                task.status === 'in_progress' ? 'bg-info/20 text-info' :
                                task.status === 'pending' ? 'bg-warning/20 text-warning' :
                                'bg-muted/20 text-muted-foreground'
                              )}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            )}
                            {task.hoursSpent && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Hours spent: </span>
                                <span className="font-semibold text-white">{task.hoursSpent}h</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 glass-surface rounded-lg text-center text-muted-foreground">
                          <Activity className="w-8 h-8 mx-auto mb-2" />
                          <p>No tasks found for this project</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="modal-actions flex justify-end gap-3 pt-6 mt-6 border-t border-border">
            <button
              type="button"
              className="px-6 py-2 bg-surface-elevated hover:bg-muted border border-border rounded-lg text-white transition-all"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !userName || !selectedProject}
              className="px-6 py-2 rounded-lg text-white font-medium transition-all flex items-center gap-2 shadow-glow disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #646cff, #8b5cf6)' }}
            >
              <Save size={16} />
              Create Report
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function Reports() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  const handleSaveReport = (reportData: any) => {
    console.log('Report saved:', reportData);
    setReports(prev => [...prev, { ...reportData, id: Date.now().toString() }]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Reports</h1>
          <p className="text-muted-foreground mt-2">Create and manage your project reports</p>
        </div>
        <Button
          onClick={() => setShowReportModal(true)}
          className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Report
        </Button>
      </div>

      {/* Reports List */}
      <div className="space-y-6">
        {reports.length === 0 ? (
          <Card className="glass shadow-elevation">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground mb-6">Create your first report to get started with project analysis and documentation.</p>
              <Button
                onClick={() => setShowReportModal(true)}
                className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="glass shadow-elevation hover:shadow-glow transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <Badge className="bg-success/20 text-success">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2">{report.project?.name || 'Project Report'}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Created by {report.userName}</p>

                  {report.project && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={cn(
                          "text-xs",
                          report.project.status === 'completed' ? 'bg-success/20 text-success' :
                          report.project.status === 'active' ? 'bg-info/20 text-info' :
                          'bg-warning/20 text-warning'
                        )}>
                          {report.project.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tasks:</span>
                        <span className="font-medium">{report.tasks?.length || 0}</span>
                      </div>
                      {report.project.budget && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-medium">${report.project.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSave={handleSaveReport}
      />
    </div>
  );
}