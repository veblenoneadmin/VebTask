import { useState } from 'react';
import { useSession } from '../lib/auth-client';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Clock,
  Calendar,
  Play,
  Pause,
  Square,
  Filter,
  Download,
  Search,
  DollarSign,
  Target,
  Building2,
  User,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TimeLog {
  id: string;
  taskTitle: string;
  projectName: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  description: string;
  isBillable: boolean;
  hourlyRate?: number;
  earnings: number;
  tags: string[];
  status: 'logged' | 'approved' | 'invoiced';
}

const mockTimeLogs: TimeLog[] = [
  {
    id: '1',
    taskTitle: 'UI Component Development',
    projectName: 'E-commerce Platform Redesign',
    clientName: 'TechCorp Solutions',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '11:30',
    duration: 150,
    description: 'Developed responsive product card components with hover animations and mobile optimization',
    isBillable: true,
    hourlyRate: 95,
    earnings: 237.50,
    tags: ['frontend', 'react', 'css'],
    status: 'approved'
  },
  {
    id: '2',
    taskTitle: 'Client Meeting',
    projectName: 'Customer Portal Development',
    clientName: 'GlobalBank Inc.',
    date: '2024-01-15',
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    description: 'Weekly status meeting to review progress and discuss upcoming milestones',
    isBillable: true,
    hourlyRate: 95,
    earnings: 95.00,
    tags: ['meeting', 'client'],
    status: 'invoiced'
  },
  {
    id: '3',
    taskTitle: 'Code Review',
    projectName: 'Data Analytics Dashboard',
    clientName: 'DataDriven LLC',
    date: '2024-01-14',
    startTime: '10:30',
    endTime: '12:00',
    duration: 90,
    description: 'Reviewed pull request for new chart components and visualization features',
    isBillable: false,
    earnings: 0,
    tags: ['review', 'code-quality'],
    status: 'logged'
  },
  {
    id: '4',
    taskTitle: 'API Integration',
    projectName: 'Mobile App MVP',
    clientName: 'StartupXYZ',
    date: '2024-01-14',
    startTime: '15:30',
    endTime: '18:00',
    duration: 150,
    description: 'Integrated authentication API and implemented user session management',
    isBillable: true,
    hourlyRate: 85,
    earnings: 212.50,
    tags: ['backend', 'api', 'authentication'],
    status: 'logged'
  },
  {
    id: '5',
    taskTitle: 'Documentation Update',
    projectName: 'Internal Tools',
    clientName: 'Internal',
    date: '2024-01-13',
    startTime: '16:00',
    endTime: '17:30',
    duration: 90,
    description: 'Updated project documentation and created setup guides for new team members',
    isBillable: false,
    earnings: 0,
    tags: ['documentation', 'internal'],
    status: 'logged'
  },
  {
    id: '6',
    taskTitle: 'Bug Fixes',
    projectName: 'E-commerce Platform Redesign',
    clientName: 'TechCorp Solutions',
    date: '2024-01-13',
    startTime: '09:00',
    endTime: '11:45',
    duration: 165,
    description: 'Fixed responsive issues on mobile devices and resolved checkout flow bugs',
    isBillable: true,
    hourlyRate: 95,
    earnings: 260.63,
    tags: ['bugfix', 'mobile', 'testing'],
    status: 'approved'
  }
];

export function TimeLogs() {
  const { data: session } = useSession();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(mockTimeLogs);
  const [selectedDateRange, setSelectedDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = timeLogs.filter(log => {
    const matchesSearch = log.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesClient = filterClient === 'all' || log.clientName === filterClient;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-success bg-success/10 border-success/20';
      case 'invoiced': return 'text-info bg-info/10 border-info/20';
      case 'logged': return 'text-warning bg-warning/10 border-warning/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const timeStats = {
    totalHours: Math.round(filteredLogs.reduce((sum, log) => sum + log.duration, 0) / 60 * 10) / 10,
    billableHours: Math.round(filteredLogs.filter(log => log.isBillable).reduce((sum, log) => sum + log.duration, 0) / 60 * 10) / 10,
    totalEarnings: filteredLogs.reduce((sum, log) => sum + log.earnings, 0),
    avgHourlyRate: filteredLogs.filter(log => log.isBillable && log.hourlyRate).length > 0 
      ? Math.round(filteredLogs.filter(log => log.isBillable && log.hourlyRate).reduce((sum, log) => sum + (log.hourlyRate || 0), 0) / filteredLogs.filter(log => log.isBillable && log.hourlyRate).length)
      : 0
  };

  const uniqueClients = [...new Set(timeLogs.map(log => log.clientName))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Time Logs</h1>
          <p className="text-muted-foreground mt-2">Track and manage your time entries</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="glass-surface">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-primary hover:bg-gradient-primary/90 text-white shadow-glow">
            <Play className="h-4 w-4 mr-2" />
            Start Timer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{timeStats.totalHours}h</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-success flex items-center justify-center shadow-glow mr-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{timeStats.billableHours}h</p>
                <p className="text-sm text-muted-foreground">Billable Hours</p>
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
                <p className="text-2xl font-bold">${timeStats.totalEarnings.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass shadow-elevation">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-warning flex items-center justify-center shadow-glow mr-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">${timeStats.avgHourlyRate}</p>
                <p className="text-sm text-muted-foreground">Avg. Rate/Hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass shadow-elevation">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search time logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Date Range */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value as any)}
              className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="logged">Logged</option>
              <option value="approved">Approved</option>
              <option value="invoiced">Invoiced</option>
            </select>

            {/* Client Filter */}
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-4 py-2 glass-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Clients</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Time Logs Table */}
      <Card className="glass shadow-elevation">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Time Entries ({filteredLogs.length})</h2>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" className="glass-surface">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Task</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Project</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Duration</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Rate</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Earnings</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-surface-elevated/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{new Date(log.date).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{log.startTime} - {log.endTime}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{log.taskTitle}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{log.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.projectName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.clientName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatDuration(log.duration)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {log.isBillable && log.hourlyRate ? (
                        <span className="text-sm font-medium">${log.hourlyRate}/hr</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Non-billable</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-success">
                        ${log.earnings.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge className={cn("text-xs capitalize", getStatusColor(log.status))}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No time logs found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' || filterClient !== 'all' 
                  ? 'Try adjusting your filters or search term'
                  : 'Start tracking your time to see logs here'
                }
              </p>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}